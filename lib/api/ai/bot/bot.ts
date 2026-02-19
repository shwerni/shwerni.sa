import { geminiAi } from "../ai";
import { sendWhatsappText } from "@/lib/api/whatsapp";

// constants
const support = "https://wa.me/966554117879";
const historySize = 5;
const limit = 15_000;

// memory stores (in-memory cache)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messageHistory = new Map<string, any[]>();
const lastMessageTime = new Map<string, number>();
const wasGreeted = new Map<string, boolean>();

// quick replies (keyword detection)
const replies: Record<string, string> = {
  تسجيل: "✨ للتسجيل في المنصة تفضل من هنا:\nhttps://shwerni.sa/auth/register",
  دخول: "🔐 لتسجيل الدخول استخدم الرابط التالي:\nhttps://shwerni.sa/auth/login",
  "نسيت كلمة المرور":
    "🔄 لاستعادة كلمة المرور تفضل من هنا:\nhttps://shwerni.sa/auth/forgetpassword",
  حجز: "📅 لحجز موعد جديد، استخدم الرابط التالي:\nhttps://shwerni.sa/available",
  تواصل: `💬 للتواصل مع خدمة العملاء مباشرة:\n${support}`,
};

// helper: rate limiter
function isRateLimited(userId: string) {
  const now = Date.now();
  const last = lastMessageTime.get(userId) || 0;
  if (now - last < limit) return true;

  lastMessageTime.set(userId, now);
  return false;
}

// random greeting
function getRandomGreeting() {
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
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// random sign-off (clearly identifies the bot)
function getRandomSignOff() {
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
  return signOffs[Math.floor(Math.random() * signOffs.length)];
}

// helper: check for quick reply
function checkQuickReply(message: string) {
  const keys = Object.keys(replies);
  for (const key of keys) {
    if (message.includes(key)) return replies[key];
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
      الخطوات: الضغط على "تسجيل"، إدخال البريد وكلمة المرور، ثم تأكيد الحساب من البريد الإلكتروني.
    - تسجيل الدخول: https://shwerni.sa/auth/login
      الخطوات: إدخال البريد وكلمة المرور ثم الضغط على "دخول".
    - استعادة كلمة المرور: https://shwerni.sa/auth/forgetpassword
      الخطوات: إدخال البريد الإلكتروني، التحقق، ثم تعيين كلمة مرور جديدة.
    - حجز موعد: https://shwerni.sa/available
      الخطوات: اختيار الخدمة، تحديد الوقت، ثم تأكيد الحجز.
    - الدعم الفني: ${support}

    ## Rules:
    - Always reply in Saudi Arabic only.
    - Keep it short and polite (1–3 sentences).
    - Never share sensitive data, code, or files.
    - Never include English text or links except for known platform URLs.
    - If unsure, guide the user to human support.

    ## lassify the message type:
    - "GREETING": start of a conversation.
    - "INQUIRY": asking for info or help.
    - "ENDING": conversation closing (thanks, done, etc).

    ## Recent Messages:
    ${chatContext}

    ## Latest Message:
    "${message}"

    ### Response Format (Strict JSON):
    {
      "reply": "Arabic text response",
      "messageType": "GREETING" | "INQUIRY" | "ENDING"
    } 
    `;

    // call AI model
    const response = await geminiAi(prompt);

    // validate
    if (!response)
      return {
        reply: "🙂 كيف أقدر أساعدك اليوم؟",
        messageType: "INQUIRY" as const,
      };

    // response parsing
    const raw = response.response.text();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    // if json extracted
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reply: parsed.reply || "🙂 كيف أقدر أساعدك اليوم؟",
        messageType:
          parsed.messageType === "GREETING"
            ? "GREETING"
            : parsed.messageType === "ENDING"
            ? "ENDING"
            : "INQUIRY",
      };
    }

    // return
    return {
      reply: "🙂 كيف أقدر أساعدك اليوم؟",
      messageType: "INQUIRY" as const,
    };
  } catch {
    // return
    return {
      reply: "🙂 كيف أقدر أساعدك اليوم؟",
      messageType: "INQUIRY" as const,
    };
  }
};

// main bot
export const customerBot = async (fromId: string, message: string) => {
  try {
    // Rate limit (avoid spam)
    if (isRateLimited(fromId)) return;

    // Keyword detection (skip AI if found)
    const quick = checkQuickReply(message);
    if (quick) {
      await sendWhatsappText(fromId, quick);
      return;
    }

    // maintain recent chat history
    const history = messageHistory.get(fromId) || [];
    history.push({ user: "user", message });
    if (history.length > historySize) history.shift();
    messageHistory.set(fromId, history);

    // build context prompt
    const chatContext = history.map((m) => `- ${m}`).join("\n");

    // get ai bot reply
    const { reply, messageType } = await aiBot(message, chatContext);
    history.push({ user: "bot", message: reply });

    // compose final message
    let finalText = "";

    // check if first message
    const isFirst = !wasGreeted.has(fromId);

    // check message type for proper replay
    if (messageType === "GREETING" && isFirst) {
      finalText = `${getRandomGreeting()}\n\n${reply}`;
      wasGreeted.set(fromId, true);
    } else if (messageType === "ENDING") {
      finalText = `${reply}\n\n${getRandomSignOff()}`;
      wasGreeted.delete(fromId);
      messageHistory.delete(fromId);
    } else {
      finalText = reply;
    }

    // send
    await sendWhatsappText(fromId, finalText);
  } catch (err) {
    console.error("Bot error:", err);
  }
};

// const userTimers = new Map<string, NodeJS.Timeout>();

// export async function handleUserMessage(
//   fromId: string,
//   message: string,
//   botHandler: (fromId: string, message: string) => Promise<void>
// ) {
//   if (userTimers.has(fromId)) clearTimeout(userTimers.get(fromId)!);

//   const timer = setTimeout(async () => {
//     await botHandler(fromId, message);
//     userTimers.delete(fromId);
//   }, 3000);

//   userTimers.set(fromId, timer);
// }
