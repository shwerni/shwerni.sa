// React & Next
import { NextRequest, NextResponse } from "next/server";

// lib
import { handleBotResponse } from "@/lib/api/ai/bot";
import { sendWhatsappText } from "@/lib/api/whatsapp";

// prisma data
import { checkBotLimit } from "@/data/admin/bot";
import { upsertWhatsappChat } from "@/data/whatsapp";
import { acceptWhatsappReview } from "@/data/review";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// type
interface WebhookMessage {
  from: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: {
    type?: string;
    button_reply?: { id: string; title: string; payload: string };
    list_reply?: { title: string };
    nfm_reply?: { response_json: string; body: string; name: string };
  };
}

// handle webhook verification
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

// handle webhook (whatsApp incoming messages)
export async function POST(request: NextRequest) {
  try {
    // body
    const body = await request.json();

    if (!body.object) return NextResponse.json({}, { status: 200 });

    // value
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;

    // validate
    if (!messages?.length)
      return NextResponse.json(
        { message: "No messages to process" },
        { status: 404 },
      );

    // data
    const msg = messages[0];
    const from: string = msg.from;
    const fromId: string = value.contacts?.[0]?.wa_id ?? from;
    const fromName: string = value.contacts?.[0]?.profile?.name ?? "مجهول";

    // handle message route
    await routeMessage(from, fromId, fromName, msg);

    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// handle message route
async function routeMessage(
  from: string,
  fromId: string,
  fromName: string,
  msg: WebhookMessage,
) {
  // Plain text → full bot flow
  if (msg.type === "text" && msg.text?.body) {
    await handleTextMessage(from, fromId, fromName, msg.text.body);
    return;
  }

  // button reply → could extend later (analytics, quick-reply flows)
  if (msg.type === "button" && msg.button?.text) {
    // reserved for future handling
    return;
  }

  // list reply
  if (msg.type === "interactive" && msg.interactive?.list_reply) {
    await telegramAdmin(`there ${msg.interactive?.list_reply}`);
    // reserved for future handling
    return;
  }

  // interactive button reply ← ADD THIS
  if (msg.type === "interactive" && msg.interactive?.button_reply) {
    const { id, title, payload } = msg.interactive.button_reply;
    await telegramAdmin(`here ${msg.interactive.button_reply}`);
    await telegramAdmin(`here ${id}, ${title}, ${payload}`);
    // console.log("📲 button_reply received:", { id, title, from });
    //  await handleButtonReply(from, fromName, id, title);
    return;
  }

  // flow / survey reply
  if (msg.type === "interactive" && msg.interactive?.nfm_reply?.response_json) {
    try {
      const flow = JSON.parse(msg.interactive.nfm_reply.response_json);
      // handle review flow
      await handleReviewFlow(from, flow);
    } catch {}
    return;
  }
}

// handle replay
async function handleTextMessage(
  from: string,
  fromId: string,
  fromName: string,
  text: string,
) {
  try {
    // simple admin test
    if (from === "201227502703") await sendWhatsappText(from, "بحب يا جنتي ❤️");

    // check limit
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

    await Promise.all([
      // customer bot replay
      handleBotResponse(fromId, from, fromName, text),
      // store in database
      upsertWhatsappChat(fromId, from, fromName, text),
    ]);
  } catch {
    return;
  }
}

// custom action for review flow
async function handleReviewFlow(
  phone: string,
  flowData: Record<string, string>,
) {
  const rate = Number(flowData["rate"]) || null;
  const name = flowData["name"]?.trim().substring(0, 12) || null;
  const comment = flowData["comment"]?.trim() || null;
  const oid = flowData["flow_token"] || null;

  // validate
  if (!oid || !rate || !name || !comment) return;

  await Promise.all([
    // post review
    acceptWhatsappReview(Number(oid), name, phone, rate, comment),
    // send confirmation to user
    sendWhatsappText(
      phone,
      "✨ شكراً لمشاركتنا رأيك!\n\nتم تسجيل تقييمك بنجاح 🙏💙\nرأيك يهمنا ويساعدنا نطوّر خدماتنا دائماً.",
    ),
  ]);
}

// async function handleButtonReply(from: string, buttonId: string) {
//   const [action, rawOrderId] = buttonId.split(":");
//   const orderId = rawOrderId ? Number(rawOrderId) : null;

//   if (action === "meeting-url" && orderId) {
//     try {
//       // fetch order from db
//       const order = await prisma.order.findUnique({
//         where: { id: orderId },
//       });

//       if (!order) {
//         await sendWhatsappText(from, "❌ لم يتم العثور على الطلب.");
//         return;
//       }

//       await sendWhatsappText(
//         from,
//         `✅ تم تأكيد طلبك رقم #${order.id} بنجاح!\nسيتم التواصل معك قريباً.`,
//       );
//     } catch {
//       await sendWhatsappText(from, "❌ حدث خطأ، يرجى المحاولة لاحقاً.");
//     }
//     return;
//   }

//   if (action === "cancel-order" && orderId) {
//     // handle cancel...
//     return;
//   }
// }
