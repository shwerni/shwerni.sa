import { NextRequest, NextResponse, after } from "next/server";

import { enqueueMessage } from "@/lib/api/ai/bot/debounce";
import { shouldSkipBotReply } from "@/lib/api/whatsapp/skip-bot";
import { handleSpecialReply } from "@/lib/api/whatsapp/special-replies";
import { routeNonText, WebhookMessage } from "@/lib/api/whatsapp/logic";
import { upsertWhatsappChat } from "@/data/whatsapp";

const DEBOUNCE_MS = 5000;

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!mode || !token) return new Response(null, { status: 400 });
  if (mode === "subscribe" && token === process.env.WHATSAPP_PASS)
    return new Response(challenge ?? "", { status: 200 });
  return new Response(null, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.object) return NextResponse.json({}, { status: 200 });

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;

    if (!messages?.length)
      return NextResponse.json({ message: "No messages" }, { status: 404 });

    const msg = messages[0];
    const from: string = msg.from;
    const fromId: string = value.contacts?.[0]?.wa_id ?? from;
    const fromName: string = value.contacts?.[0]?.profile?.name ?? "مجهول";

    // ── Non-text messages: handle immediately, no debounce needed ──
    if (msg.type !== "text") {
      after(async () => {
        await routeNonText(from, msg as WebhookMessage);
      });
      return NextResponse.json({}, { status: 200 });
    }

    const text = msg.text?.body;
    if (!text) return NextResponse.json({}, { status: 200 });

    // Save every incoming message to history regardless of what happens next
    await upsertWhatsappChat(fromId, from, fromName, text);

    // ── Special replies: a rule fully owns this message (e.g. Google Meet
    //    link request). If matched, its own reply was already sent —
    //    stop here, don't enqueue, don't call the AI. ──
    const handled = await handleSpecialReply({ phone: from, text });
    if (handled) return NextResponse.json({}, { status: 200 });

    // ── Full skip: numbers that should get zero response at all ──
    if (shouldSkipBotReply({ phone: from, text })) {
      return NextResponse.json({}, { status: 200 });
    }

    // Enqueue with a dueAt timestamp — each new message from the same
    // phone pushes dueAt forward, which is the debounce mechanism itself.
    await enqueueMessage(from, text, fromId, fromName, Date.now(), DEBOUNCE_MS);

    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}