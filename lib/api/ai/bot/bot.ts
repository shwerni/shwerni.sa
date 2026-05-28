import { Ai } from "../ai";
import { getRecentMessages } from "@/data/bot";
import { sendWhatsappText } from "@/lib/api/whatsapp";

// constants
const support = "https://wa.me/966554117879";

// quick replies (keyword detection)
const quickReplies: Record<string, string> = {
  تسجيل: "✨ للتسجيل في المنصة تفضل من هنا:\nhttps://shwerni.sa/auth/register",
  دخول: "🔐 لتسجيل الدخول استخدم الرابط التالي:\nhttps://shwerni.sa/auth/login",
  "نسيت كلمة المرور":
    "🔄 لاستعادة كلمة المرور تفضل من هنا:\nhttps://shwerni.sa/auth/forgetpassword",
  حجز: "📅 لحجز موعد جديد، استخدم الرابط التالي:\nhttps://shwerni.sa/available",
  تواصل: `💬 للتواصل مع خدمة العملاء مباشرة:\n${support}`,
};

//  random greeting pool
const greetings = [
  "أهلًا وسهلًا 👋",
  "مرحبًا بك في شاورني 🌟",
  "ياهلا فيك! 🙌",
  "حياك الله 💚",
  "ياهلا وسهلا 🤗",
  "نورتنا اليوم ✨",
  "هلا فيك 👋 كيف نقدر نساعدك؟",
  "سعيدين بتواصلك معنا 💫",
  "مرحبًا فيك، تفضل اسألنا بكل راحة ☕",
];

// random sign-off pool
const signOffs = [
  "🤖 أنا مساعد شاورني الذكي، هنا لمساعدتك دائمًا 💚",
  "📱 مساعد شاورني الآلي معك بكل ود 😊",
  "✨ مع تحيات مساعد شاورني الذكي 🌷",
  "🤖 شكرًا لتواصلك مع مساعد شاورني 💬",
  "🌟 مساعد شاورني الذكي يتمنى لك يومًا جميلًا!",
  "💡 مساعد شاورني هنا لأي استفسار أو مساعدة 🙏",
  "😊 شكرًا لوقتك! مساعد شاورني الذكي دومًا في خدمتك 🤖",
  "💬 مساعد شاورني – رد آلي لخدمتك بكل ود 🌷",
  "🌼 تحياتي، مساعد شاورني الذكي لخدمتك 🤖",
  "🤖 أنا مساعد شاورني الذكي، سعدت بخدمتك اليوم 💚",
];
// get random
const getRandom = (arr: string[]) =>
  arr[Math.floor(Math.random() * arr.length)];

// helper: check for quick reply
function checkQuickReply(message: string): string | null {
  for (const key of Object.keys(quickReplies)) {
    if (message.includes(key)) return quickReplies[key];
  }
  return null;
}

// ai generate
export const aiBot = async (message: string, chatContext: string) => {
  try {
    const prompt = `
    You are an AI customer service assistant for a Saudi Arabian platform.
    Your tone must always be polite, clear, and in **Saudi Arabic**, include emojis naturally (1–3 per message), 
    and use new lines, titles, or bullet points when helpful for clarity.
    You are not a general AI model — you only provide support related to the platform.
    Always respond based on the knowledge below.
    If a user asks about something unrelated, respond with:
    "عذرًا، لا أستطيع المساعدة في هذا الموضوع. يمكنك التواصل مع خدمة العملاء هنا: ${support}"

    ## Platform Knowledge:
    - التسجيل: https://shwerni.sa/auth/register
    - تسجيل الدخول: https://shwerni.sa/auth/login
    - استعادة كلمة المرور: https://shwerni.sa/auth/forgetpassword
    - حجز موعد: https://shwerni.sa/available
    - الدعم الفني: ${support}

    ## Rules:
    - Always reply in Saudi Arabic only.
    - Keep it short and polite (1–3 sentences).
    - Never share sensitive data, code, or files.

    ## Classify the message type:
    - "GREETING": start of a conversation.
    - "INQUIRY": asking for info or help.
    - "ENDING": conversation closing (thanks, done, etc).

    ## Recent Messages:
    ${chatContext}

    ## Latest Message:
    "${message}"

    ### Response Format (Strict JSON only, no markdown):
    {
      "reply": "Arabic text response",
      "messageType": "GREETING" | "INQUIRY" | "ENDING"
    }`;

    // call AI model
    const response = await Ai(prompt);

    // validate
    if (!response)
      return {
        reply: "🙂 كيف أقدر أساعدك اليوم؟",
        messageType: "INQUIRY" as const,
      };

    // response parsing
    const match = response.match(/\{[\s\S]*\}/);

    // validate
    if (!match)
      return {
        reply: "🙂 كيف أقدر أساعدك اليوم؟",
        messageType: "INQUIRY" as const,
      };

    // send
    try {
      // message
      const parsed = JSON.parse(match[0]);
      //
      return {
        reply: parsed.reply || "🙂 كيف أقدر أساعدك اليوم؟",
        messageType: (["GREETING", "ENDING"].includes(parsed.messageType)
          ? parsed.messageType
          : "INQUIRY") as "GREETING" | "INQUIRY" | "ENDING",
      };
    } catch {
      return {
        reply: "🙂 كيف أقدر أساعدك اليوم؟",
        messageType: "INQUIRY" as const,
      };
    }
  } catch {
    return {
      reply: "🙂 كيف أقدر أساعدك اليوم؟",
      messageType: "INQUIRY" as const,
    };
  }
};

// main bot
export const customerBot = async (fromId: string, message: string) => {
  try {
    // check quick replay
    const quick = checkQuickReply(message);

    if (quick) {
      await sendWhatsappText(fromId, quick);
      return;
    }

    // Rate limit (avoid spam)
    const rawMessages = await getRecentMessages(fromId, 5);
    const history = rawMessages.reverse();

    // build context prompt
    const chatContext = history
      .map(
        (m) => `- ${m.from === "966553689116" ? "bot" : "user"}: ${m.content}`,
      )
      .join("\n");

    // get ai bot reply
    const { reply, messageType } = await aiBot(message, chatContext);

    // if  first
    const isFirst = history.length === 0;

    // compose final message
    let finalText = "";

    // check message type for proper replay
    if (messageType === "GREETING" && isFirst) {
      finalText = `${getRandom(greetings)}\n\n${reply}`;
    } else if (messageType === "ENDING") {
      finalText = `${reply}\n\n${getRandom(signOffs)}`;
    } else {
      finalText = reply;
    }

    // send
    await sendWhatsappText(fromId, finalText);
    // await upsertWhatsappChat(fromId, "966553689116", "شاورني Bot", finalText);
  } catch  {
    return null;
  }
};

// ─────────────────────────────────────────────
// Debounced message handler (commented — enable if needed)
// ─────────────────────────────────────────────

const userTimers = new Map<string, NodeJS.Timeout>();

export async function handleUserMessage(
  fromId: string,
  message: string,
  botHandler: (fromId: string, message: string) => Promise<void>,
) {
  if (userTimers.has(fromId)) clearTimeout(userTimers.get(fromId)!);

  const timer = setTimeout(async () => {
    await botHandler(fromId, message);
    userTimers.delete(fromId);
  }, 3000);

  userTimers.set(fromId, timer);
}
