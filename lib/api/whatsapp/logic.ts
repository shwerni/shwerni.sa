import { handleBotResponse } from "@/lib/api/ai/bot";
import { sendWhatsappText } from "@/lib/api/whatsapp";
import { checkBotLimit } from "@/data/admin/bot";
import { acceptWhatsappReview } from "@/data/review";
import { getMeetingUrl } from "@/data/meetings";
import {
  markDoneFromWhatsapp,
  rescheduleLinkForWhatsapp,
} from "@/handlers/meetings/reschedule";

export interface WebhookMessage {
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

export async function debouncedTextMessage(
  from: string,
  fromId: string,
  fromName: string,
  text: string,
) {
  try {
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

    await handleBotResponse(fromId, from, fromName, text);
  } catch {
    return;
  }
}

export async function routeNonText(from: string, msg: WebhookMessage) {
  if (msg.type === "button" && msg.button?.text) {
    const [action, data] = msg.button.payload.split(":");
    try {
      await handleButtonReply(from, action, data);
    } catch {}
    return;
  }

  if (msg.type === "interactive" && msg.interactive?.nfm_reply?.response_json) {
    try {
      const flow = JSON.parse(msg.interactive.nfm_reply.response_json);
      await handleReviewFlow(from, flow);
    } catch {}
    return;
  }
}

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

  // the reschedule link carries the client's own token (their access), sent only to the order's
  // own number (handlers/meetings/reschedule.ts)
  if (action === "rescheduling" && data) {
    const link = await rescheduleLinkForWhatsapp(data, from);
    if (!link) return;
    await sendWhatsappText(
      from,
      `تفضل رابط اعادة الجدولة #${link.orderId} \n لاختيار موعد اخر برجاء استخدام الرابط التالي🌸.\n${link.url}`,
    );
    return;
  }

  // only from the order's own number, a paid session whose time came
  if (action === "meeting-done" && data) {
    await markDoneFromWhatsapp(data, from);
    return;
  }
}