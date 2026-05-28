// React & Next
import { NextResponse } from "next/server";

// utils
import { meetingLabel } from "@/utils/time";
import { findApprovalState, findConsultantState } from "@/utils";

// prisma data
import {
  BotClientOrder,
  BotConsultantDues,
  BotConsultantOrder,
  BotDetectUser,
  BotGetConsultant,
  BotGetConsultantData,
  getRecentMessages,
} from "@/data/bot";

import { upsertWhatsappChat } from "@/data/whatsapp";

// auth
import { User } from "next-auth";

// lib
import { AiBot } from "./setup";
import { timeZone } from "@/lib/site/time";
import { sendWhatsappText } from "@/lib/api/whatsapp";
import { telegramAdmin } from "../../telegram/telegram";

// prisma types
import { UserRole } from "@/lib/generated/prisma/client";

// actions
type BotActions =
  | "user_meeting"
  | "consultant_meetings"
  | "consultant_dues"
  | "consultant_info";

// support link
const support = "https://wa.me/966554117879";

// per-user processing lock — prevents race conditions on rapid messages
// NOTE: use Redis (e.g. Upstash) instead if running on serverless/multi-instance
const processingUsers = new Set<string>();

// ─────────────────────────────────────────────
// 🔧 SHARED HELPERS
// ─────────────────────────────────────────────

// extract json safely from AI response string
export const oExtractJson = async (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", error);
    return null;
  }
};

// build conversation context string from DB messages
function buildConversation(
  messages: { content: string; from: string }[],
  displayName: string,
  botPhone = "966553689116",
) {
  return messages
    .map((m) => {
      const label = m.from === botPhone ? "شاورني - bot" : displayName;
      return `${label}: ${m.content}`;
    })
    .join("\n");
}

// ─────────────────────────────────────────────
// 🤖 BOT ACTIONS (all DB-based, no Maps)
// ─────────────────────────────────────────────

// FIX: Added the missing `<` to complete the Record type definition
const botActions: Record<
  BotActions,
  (from: string, role?: string, cid?: number) => Promise<string>
> = {
  // 📅 user meetings
  async user_meeting(from) {
    const { date, time } = timeZone();
    const meeting = await BotClientOrder(from, date, time);

    if (!meeting) return "ما عندك جلسات قادمة 📭";

    return `الجلسات القادمة:\n🗓️ #${meeting.oid}\n${meetingLabel(
      meeting.meeting[0].time,
      meeting.meeting[0].date,
    )}\n👤 المستشار: ${meeting.consultant.name}`;
  },

  // 💼 consultant meetings
  async consultant_meetings(from, role) {
    if (role !== UserRole.OWNER) return "هذه المعلومات خاصة فقط بالمستشارين 🔒";

    const { date, time } = timeZone();
    const meetings = await BotConsultantOrder(from, date, time);

    if (!meetings?.length) return "ما عندك جلسات مجدولة حالياً 📭";

    const lines = meetings.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) =>
        `🗓️ جلسة #${m.oid}\n${meetingLabel(
          m.meeting[0].time,
          m.meeting[0].date,
        )}\n👥 العميل: ${m.name || m.phone}`,
    );

    return "مواعيدك القادمة:\n" + lines.join("\n\n");
  },

  // 💰 consultant dues — cid passed directly, no extra DB lookup
  async consultant_dues(_from, role, cid) {
    if (role !== UserRole.OWNER) return "هذه المعلومات خاصة فقط بالمستشارين 🔒";
    if (!cid) return "ما لقيت بياناتك حالياً ⚙️";

    const { date } = timeZone();
    const dues = await BotConsultantDues(cid, date);

    if (!dues) return "ما لقيت بياناتك حالياً ⚙️";

    return `💰 مستحقاتك لهذا الشهر: ${dues} ريال سعودي`;
  },

  // 🧾 consultant info
  async consultant_info(from, role) {
    if (role !== UserRole.OWNER) return "هذه المعلومات خاصة فقط بالمستشارين 🔒";

    const consultant = await BotGetConsultantData(from);
    if (!consultant) return "ما لقيت بياناتك حالياً ⚙️";

    const genderLabel = consultant.gender === "MALE" ? "المستشار" : "المستشارة";
    const link = `https://shwerni.sa/consultant/${consultant.cid}`;

    // FIX: Cleaned up the template literal formatting for better readability
    return `${genderLabel} ${consultant.name}\nرقم المستشار: #${consultant.cid}\n🔗 رابط الملف:\n ${link}\n\n📁 حالة اعتماد الملف:\n ${findApprovalState(consultant.approved)?.label}\n\n⚙️ حالة الحساب:\n ${findConsultantState(consultant.statusA)?.label}`;
  },
};

// ─────────────────────────────────────────────
// 📲 WHATSAPP BOT HANDLER
// ─────────────────────────────────────────────

export async function handleBotResponse(
  fromId: string,
  from: string,
  fromName: string,
  message: string,
) {
  // prevent duplicate processing if user sends rapidly
  if (processingUsers.has(from)) return NextResponse.json({}, { status: 200 });

  processingUsers.add(from);

  try {
    // detect user + consultant from DB on every request (no in-memory session)
    const user = await BotDetectUser(from);

    let consultant = null;
    if (user?.id && user.role === UserRole.OWNER) {
      // fetch in parallel with history load below
      consultant = await BotGetConsultant(user.id);
    }

    // display name
    const displayName =
      consultant?.name || user?.name || fromName || "مستخدم مجهول";

    // load recent history from DB
    const rawMessages = await getRecentMessages(from, 8);

    // reverse — DB returns desc, we need asc for conversation flow
    const history = rawMessages.reverse();

    // build conversation context for AI
    const conversation = buildConversation(history, displayName);

    // build AI input
    const input = JSON.stringify({
      name: displayName,
      message,
      role: user?.role === UserRole.OWNER ? UserRole.OWNER : UserRole.USER,
      conversationhistory: conversation,
    });

    // get ai reply
    const botResponse = await AiBot(input);

    // parse safely
    const parsed = (await oExtractJson(botResponse)) || {};
    const { reply, messageType, actionName } = parsed;

    // if normal message — just reply
    if (messageType !== "ACTION") {
      if (reply) {
        await sendWhatsappText(from, reply);
        await upsertWhatsappChat(fromId, "966553689116", fromName, reply);
      }
      return NextResponse.json({}, { status: 200 });
    }

    // handle action
    let actionResult = "ما فهمت الإجراء المطلوب 🤔";
    const handler = botActions[actionName as BotActions];

    if (handler) {
      try {
        // pass role + cid so dues action avoids a redundant DB lookup
        actionResult = await handler(from, user?.role, consultant?.cid);
      } catch {
        actionResult = "حدث خطأ أثناء تنفيذ العملية ⚠️";
      }
    }

    // send bot reply + action result
    if (reply) {
      await sendWhatsappText(from, reply);
      await upsertWhatsappChat(fromId, "966553689116", fromName, reply);
    }

    if (actionResult) {
      await sendWhatsappText(from, actionResult);
      await upsertWhatsappChat(fromId, "966553689116", fromName, actionResult);
    }

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    await sendWhatsappText(
      from,
      `حدث خطأ غير متوقع. يرجى المحاولة لاحقاً ⚙️\nالدعم الفني: ${support}`,
    );
    await telegramAdmin(String(error));
    return NextResponse.json({}, { status: 500 });
  } finally {
    // always release the lock
    processingUsers.delete(from);
  }
}

// ─────────────────────────────────────────────
// 💬 WEBSITE CHAT BOT HANDLER
// ─────────────────────────────────────────────

export async function handleBotReply(
  fromId: string,
  message: string,
  user: User | undefined,
  displayName: string,
) {
  // prevent duplicate processing if user sends rapidly
  if (processingUsers.has(fromId)) return null;

  processingUsers.add(fromId);

  try {
    // load recent history from DB (replaces in-memory Map)
    const rawMessages = await getRecentMessages(fromId, 8);

    // reverse — DB returns desc, we need asc for conversation flow
    const history = rawMessages.reverse();

    // build conversation context for AI
    const conversation = buildConversation(history, displayName);

    // build AI input
    const input = JSON.stringify({
      name: displayName,
      message,
      role: user?.role === UserRole.OWNER ? UserRole.OWNER : UserRole.USER,
      conversationhistory: conversation,
    });

    // get ai reply
    const botResponse = await AiBot(input);

    // parse safely
    const parsed = (await oExtractJson(botResponse)) || {};
    const { reply, messageType, actionName } = parsed;

    // if normal message — just reply
    if (messageType !== "ACTION") {
      if (reply) {
        await upsertWhatsappChat(fromId, "966553689116", displayName, reply);
      }
      return reply;
    }

    // resolve consultant cid if OWNER (avoid redundant lookup in action)
    let consultantCid: number | undefined;
    if (user?.role === UserRole.OWNER && user?.id) {
      const consultant = await BotGetConsultant(user.id);
      consultantCid = consultant?.cid;
    }

    // handle action
    let actionResult = "ما فهمت الإجراء المطلوب 🤔";
    const handler = botActions[actionName as BotActions];

    if (handler) {
      try {
        actionResult = await handler(fromId, user?.role, consultantCid);
      } catch {
        actionResult = "حدث خطأ أثناء تنفيذ العملية ⚠️";
      }
    }

    // persist both messages
    if (reply) {
      await upsertWhatsappChat(fromId, "966553689116", displayName, reply);
    }

    if (actionResult) {
      await upsertWhatsappChat(
        fromId,
        "966553689116",
        displayName,
        actionResult,
      );
    }

    // return combined or action result if reply is empty
    return reply ? `${reply}\n\n${actionResult}` : actionResult;
  } catch (error) {
    await telegramAdmin(String(error));
    return `حدث خطأ غير متوقع. يرجى المحاولة لاحقاً ⚙️\nالدعم الفني: ${support}`;
  } finally {
    // always release the lock
    processingUsers.delete(fromId);
  }
}
