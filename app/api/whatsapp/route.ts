import { NextRequest, NextResponse, after } from "next/server";

// lib
import { handleBotResponse } from "@/lib/api/ai/bot";
import { sendWhatsappText } from "@/lib/api/whatsapp";
import { createGoogleMeeting } from "@/lib/api/google";
import { enqueueMessage, drainQueueIfLast } from "@/lib/api/ai/bot/debounce";

// prisma data
import { meetingDone } from "@/data/reschedule";
import { checkBotLimit } from "@/data/admin/bot";
import { acceptWhatsappReview } from "@/data/review";
import { upsertWhatsappChat } from "@/data/whatsapp";
import { getMeetingUrl, isMeetingNeedsReschedule } from "@/data/meetings";

// constatns
import { mainRoute } from "@/constants/links";

interface WebhookMessage {
  from: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: {
    type?: string;
    list_reply?: { title: string };
    nfm_reply?: { response_json: string; body: string; name: string };
  };
}

// 5s — change to 3000 on Vercel Hobby plan
const DEBOUNCE_MS = 5000;
// seconds — set to 10 on Vercel Hobby
export const maxDuration = 30;

// ─────────────────────────────────────────────
// GET — webhook verification (unchanged)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST — incoming WhatsApp messages
// ─────────────────────────────────────────────

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
        await routeNonText(from, msg);
      });
      return NextResponse.json({}, { status: 200 });
    }

    // ── Text messages: save → enqueue → debounce → process ──
    const text = msg.text?.body;
    if (!text) return NextResponse.json({}, { status: 200 });

    // Snapshot timestamp BEFORE async work
    const myTimestamp = Date.now();

    // Save user message to DB immediately (history always up to date)
    await upsertWhatsappChat(fromId, from, fromName, text);

    // Atomic enqueue in Prisma (race-condition safe)
    await enqueueMessage(from, text, myTimestamp);

    // Return 200 to WhatsApp RIGHT NOW — critical, prevents retries
    after(async () => {
      // Wait the debounce window
      await sleep(DEBOUNCE_MS);

      // Are we still the last message?
      const pending = await drainQueueIfLast(from, myTimestamp);
      if (!pending) return; // newer message will handle it

      // Combine all messages the user sent in this burst
      const combined = pending.join("\n");

      // Run the full bot pipeline — one AI call for the whole burst
      await debouncedTextMessage(from, fromId, fromName, combined);
    });

    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────
// Bot pipeline — runs after debounce window
// ─────────────────────────────────────────────
async function debouncedTextMessage(
  from: string,
  fromId: string,
  fromName: string,
  text: string,
) {
  try {
    // Admin shortcut
    if (from === "201227502703") {
      await sendWhatsappText(from, "بحب يا جنتي ❤️");
      return;
    }

    // Google Meet link shortcut
    if (from === "966554117879" && text === "رابط اجتماع جوجل جديد - zxsrexz") {
      const url = await createGoogleMeeting();
      if (url) await sendWhatsappText(from, url);
      return;
    }

    // Rate limit check
    if (from !== "201222166530") {
      const allowed = await checkBotLimit(from);
      if (!allowed) {
        await sendWhatsappText(
          from,
          `❌ لقد وصلت إلى الحد الأقصى لعدد الرسائل اليوم. حاول مرة أخرى غدًا.\nالدعم الفني: https://wa.me/966554117879`,
        );
        return;
      }
    }

    // Single AI call with combined/batched text
    await handleBotResponse(fromId, from, fromName, text);
  } catch {
    return;
  }
}

// ─────────────────────────────────────────────
// Non-text message router (buttons, flows)
// ─────────────────────────────────────────────
async function routeNonText(from: string, msg: WebhookMessage) {
  // Button reply
  if (msg.type === "button" && msg.button?.text) {
    const [action, data] = msg.button.payload.split(":");
    try {
      await handleButtonReply(from, action, data);
    } catch {}
    return;
  }

  // Flow / survey reply
  if (msg.type === "interactive" && msg.interactive?.nfm_reply?.response_json) {
    try {
      const flow = JSON.parse(msg.interactive.nfm_reply.response_json);
      await handleReviewFlow(from, flow);
    } catch {}
    return;
  }
}

// ─────────────────────────────────────────────
// Handlers — unchanged from your original
// ─────────────────────────────────────────────
async function handleReviewFlow(
  phone: string,
  flowData: Record<string, string>,
) {
  const rate = Number(flowData["rate"]) || null;
  const name = flowData["name"]?.trim().substring(0, 12) || null;
  const comment = flowData["comment"]?.trim() || null;
  const oid = flowData["flow_token"] || null;

  if (!oid || !rate || !name || !comment) return;

  await Promise.all([
    acceptWhatsappReview(Number(oid), name, phone, rate, comment),
    sendWhatsappText(
      phone,
      "✨ شكراً لمشاركتنا رأيك!\n\nتم تسجيل تقييمك بنجاح 🙏💙\nرأيك يهمنا ويساعدنا نطوّر خدماتنا دائماً.",
    ),
  ]);
}

async function handleButtonReply(from: string, action: string, data: string) {
  if (action === "meeting-url" && data) {
    const meeting = await getMeetingUrl(data, from);
    if (!meeting) return;
    await sendWhatsappText(
      from,
      `تفضل رابط الجلسة #${meeting.orderId} \nاحرص على الدخول في الوقت المحدد، نحن بانتظارك بكل ود 🌸⏰😊.\n${meeting.url}`,
    );
    return;
  }

  if (action === "rescheduling" && data) {
    const meeting = await isMeetingNeedsReschedule(data);
    if (!meeting) return;
    const url = `${mainRoute}reschedule/${data}`;
    await sendWhatsappText(
      from,
      `تفضل رابط اعادة الجدولة #${meeting.orderId} \n لاختيار موعد اخر برجاء استخدام الرابط التالي🌸.\n${url}`,
    );
    return;
  }

  if (action === "meeting-done" && data) {
    await meetingDone(data);
    return;
  }
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
