// React & Next
import { NextRequest, NextResponse } from "next/server";

// lib
import { handleBotResponse } from "@/lib/api/ai/bot";
import { sendWhatsappText } from "@/lib/api/whatsapp";

// prisma data
import { checkBotLimit } from "@/data/admin/bot";
import { upsertWhatsappChat } from "@/data/whatsapp";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// handle webhook (whatsApp incoming messages)
export async function POST(request: NextRequest) {
  try {
    // body
    const body = await request.json();

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      // validate
      if (messages && messages.length > 0)
        return NextResponse.json(
          { message: "No messages to process" },
          { status: 404 },
        );

      // const phoneId = value.metadata.phone_number_id;
      const fromId = value.contacts?.[0]?.wa_id;
      const from = messages[0].from;
      const fromName = value.contacts?.[0]?.profile?.name;
      const msg_body = messages[0];
      telegramAdmin(msg_body);
      // text message
      let textMess = "";

      // normal text
      if (msg_body.type === "text" && msg_body.text?.body) {
        textMess = msg_body.text.body;
        await replay(from, fromId, fromName, textMess);
      }

      // button replies
      else if (msg_body.type === "button" && msg_body.button?.text) {
        textMess = msg_body.button.text;
      }

      // list replies
      else if (
        msg_body.type === "interactive" &&
        msg_body.interactive?.list_reply
      ) {
        textMess = msg_body.interactive.list_reply.title;
      }

      // flow replies (survey / form)
      else if (
        (msg_body.type === "interactive" ||
          msg_body.interactive?.type === "nfm_reply") &&
        msg_body.interactive?.nfm_reply
      ) {
        const nfmReply = msg_body.interactive.nfm_reply;
        telegramAdmin(nfmReply || "work flow empty");
        let flowText = "";

        if (nfmReply.response_json) {
          const flowData = JSON.parse(nfmReply.response_json);

          flowText = Object.entries(flowData)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");

          telegramAdmin("flpd daata");
          telegramAdmin(flowText);
        } else if (nfmReply.body) {
          flowText = nfmReply.body;
          telegramAdmin("nfm body");
          telegramAdmin(flowText);
        } else {
          flowText = "Flow submitted with no response_json";
          telegramAdmin("nfm text");
          telegramAdmin(flowText);
        }

        const flowName = nfmReply.name || "Unnamed Flow";
        textMess = `📋 Flow: ${flowName}\n${flowText}`;
        telegramAdmin("name");
        telegramAdmin(textMess);
        telegramAdmin(flowName);
      }

      // return
      if (!textMess) return NextResponse.json({}, { status: 200 });

      // simple admin test
      if (from === "201227502703") {
        await sendWhatsappText(from, "بحب يا جنتي ❤️");
      }
    }

    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// handle webhook verification
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WHATSAPP_PASS) {
      return new Response(challenge || "", { status: 200 });
    } else {
      return new Response(null, { status: 403 });
    }
  }

  return new Response(null, { status: 400 });
}
// handle replay
const replay = async (
  from: string,
  fromId: string,
  fromName: string,
  textMess: string,
) => {
  try {
    // check limit
    if (from! == "201222166530") {
      const allowed = await checkBotLimit(from);

      if (!allowed) {
        await sendWhatsappText(
          from,
          `❌ لقد وصلت إلى الحد الأقصى لعدد الرسائل اليوم. حاول مرة أخرى غدًا./nالدعم الفني: https://wa.me/966554117879`,
        );

        return NextResponse.json({}, { status: 200 });
      }
    }

    // customer bot
    await handleBotResponse(fromId, from, fromName, textMess);

    // store in database
    await upsertWhatsappChat(fromId, from, fromName, textMess);

    return true;
  } catch {
    return false;
  }
};
// custom action for review flow
// async function handleReviewFlow(fromId: string, flowData: Record<string, any>) {
//   const rating = flowData["screen_0___0"] || "unknown";
//   const feedback = flowData["screen_0__1"] || "";

//   // Example: send to Telegram admin
//   await telegramAdmin(`⭐ New Review Received:
// From: ${fromId}
// Rating: ${rating}
// Feedback: ${feedback}`);

//   // Example: you can store in your database here
//   // await prisma.review.create({ data: { userId: fromId, rating, feedback } });

//   // Optionally send confirmation to user
//   await sendWhatsappText(
//     fromId,
//     "✅ شكراً لمشاركتك رأيك! تم تسجيل التقييم بنجاح ❤️"
//   );
// }

// telegram
// await telegramAdmin("whtasapp message received:");
// await telegramAdmin(
//   typeof msg_body === "string"
//     ? msg_body
//     : typeof msg_body === "object"
//     ? JSON.stringify(msg_body)
//     : String(msg_body)
// );

// image  // later
// {"from":"201222166530","id":"wamid.HBgMMjAxMjIyMTY2NTMwFQIAEhggQTVEQTIyMjYyMzJFQkZFMkUxRjZDQUYyNzQ3MTk5MzIA","timestamp":"1761201042","type":"image","image":{"mime_type":"image/jpeg","sha256":"Gvnh1d6dpMjvp0fax9btFgiZTuNb4i4uCPoWYX3J8Hw=","id":"1154040149480303"}}
// https://graph.facebook.com/v21.0/1154040149480303?phone_number_id=586473104542070

// flow
// {
//     "context": {
//         "from": "966553689116",
//         "id": "wamid.HBgMMjAxMjIyMTY2NTMwFQIAERgSMjVBN0FBNEI3MjkxRjMwNzkwAA=="
//     },
//     "from": "201222166530",
//     "id": "wamid.HBgMMjAxMjIyMTY2NTMwFQIAEhggQTVEQjgyRTk2MkM0OTU0NTNGNDU0MjY4NjRBRjI0RTcA",
//     "timestamp": "1761200781",
//     "type": "interactive",
//     "interactive": {
//         "type": "nfm_reply",
//         "nfm_reply": {
//             "response_json": "{\"screen_0___0\":\"1_\\u2605\\u2605\\u2605\\u2605\\u2606_\\u2022_\\u0645\\u0645\\u062a\\u0627\\u0632___________(4\\/5)\",\"screen_0__1\":\"\\u0627\\u0644\\u0645\\u0633\\u062a\\u0634\\u0627\\u0631 \\u0645\\u0645\\u062a\\u0627\\u0632 \\u0634\\u0643\\u0631\\u0627 \\u0644\\u0643\\u0645\",\"flow_token\":\"unused\"}",
//             "body": "Sent",
//             "name": "flow"
//         }
//     }
// }
