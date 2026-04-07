// React & Next
import { NextResponse } from "next/server";

// lib
import { AiBot } from "./setup";
import { sendWhatsappText } from "@/lib/api/whatsapp";

// utils
import { meetingLabel } from "@/utils/time";

// prisma data
import {
  BotClientOrder,
  BotConsultantDues,
  BotConsultantOrder,
  BotDetectUser,
  BotGetConsultant,
  BotGetConsultantData,
} from "@/data/bot";
import { telegramAdmin } from "../../telegram/telegram";
import { upsertWhatsappChat } from "@/data/whatsapp";
import { Gender,  UserRole } from "@/lib/generated/prisma/client";
import { findApprovalState, findConsultantState } from "@/utils";
import { timeZone } from "@/lib/site/time";
import { User } from "next-auth";

// types
// type BotMessageType = "GREETING" | "INQUIRY" | "ENDING" | "ACTION";

// actions
type BotActions =
  | "user_meeting"
  | "consultant_meetings"
  | "consultant_dues"
  | "consultant_info";

// role session
const sessionUser = new Map<string, Partial<User>>();

// consultant
const sessionConsultant = new Map<
  string,
  { cid: number; name: string; gender: Gender }
>();

// chat memory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userChatHistory = new Map<string, any[]>();

// max history
const max = 6;

export async function handleBotResponse(
  fromId: string,
  from: string,
  fromName: string,
  message: string,
) {
  try {
    // user
    let user = sessionUser.get(from);

    // check user
    if (!user) {
      // get new user
      const newUser = await BotDetectUser(from);

      // set new user
      if (newUser) {
        sessionUser.set(from, newUser);
        user = newUser;
      }
    }

    // check consultant
    if (
      user?.id &&
      user.role === UserRole.OWNER &&
      !sessionConsultant.get(from)
    ) {
      // get consultant
      const consultant = await BotGetConsultant(user.id);

      // set consultant
      if (consultant)
        sessionConsultant.set(from, {
          cid: consultant.cid,
          name: consultant.name,
          gender: consultant.gender,
        });
    }

    // display name
    const displayName =
      sessionConsultant.get(from)?.name ||
      sessionUser.get(from)?.name ||
      "مستخدم مجهول";

    // store chat message in memory
    let history = userChatHistory.get(from) || [];

    // push new message
    history.push({ sender: "user", message });

    // trim old messages
    if (history.length > max) history = history.slice(-max);

    // save back
    userChatHistory.set(from, history);

    // build prompt for AI with context
    const conversation = history
      .map(
        (m) =>
          `${m.sender === "user" ? displayName : "شاورني - bot"}: ${m.message}`,
      )
      .join("\n");

    // input
    const input = JSON.stringify({
      name: displayName,
      message: message,
      role:
        sessionUser.get(from)?.role === UserRole.OWNER
          ? UserRole.OWNER
          : UserRole.USER,
      conversationhistory: conversation,
    });

    // get ai replay
    const botResponse = await AiBot(input);

    // parsed
    const parsed = (await oExtractJson(botResponse)) || {};

    // replay
    const { reply, messageType, actionName } = parsed;

    // add bot message to history
    if (reply) {
      history.push({ sender: "bot", message: reply });
      if (history.length > max) history = history.slice(-max);
      userChatHistory.set(from, history);
    }

    // If normal message — just reply
    if (messageType !== "ACTION") {
      // here
      await sendWhatsappText(from, reply);
      // upsert bot message
      await upsertWhatsappChat(fromId, "966553689116", fromName, reply);
      // replay
      return NextResponse.json({}, { status: 200 });
    }

    // actions
    let actionResult = "ما فهمت الإجراء المطلوب 🤔";

    // action handler
    const handler = botActions[actionName as BotActions];

    // get handler
    if (handler) {
      try {
        actionResult = await handler(from);
      } catch {
        actionResult = "حدث خطأ أثناء تنفيذ العملية ⚠️";
      }
    }

    // send bot reply
    if (reply) {
      // send whatsapp
      await sendWhatsappText(from, reply);
      // upseert bot message
      await upsertWhatsappChat(fromId, "966553689116", fromName, reply);
    }

    if (actionResult) {
      // send whatsapp
      await sendWhatsappText(from, actionResult);
      // upseert bot message
      await upsertWhatsappChat(fromId, "966553689116", fromName, actionResult);
    }

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    await sendWhatsappText(
      from,
      `حدث خطأ غير متوقع. يرجى المحاولة لاحقاً ⚙️\nالدعم الفني: https://wa.me/966554117879`,
    );
    await telegramAdmin(String(error));
    return NextResponse.json({}, { status: 500 });
  }
}

// bot actions
const botActions: Record<BotActions, (from: string) => Promise<string>> = {
  // 📅 user meetings
  async user_meeting(from) {
    // date
    const { date, time } = timeZone();

    // get meeting
    const meeting = await BotClientOrder(from, date, time);

    // validate
    if (!meeting) return "ما عندك جلسات قادمة 📭";

    // return
    return `الجلسات القادمة:\n🗓️ #${meeting.oid}\n${meetingLabel(
      meeting.meeting[0].time,
      meeting.meeting[0].date,
    )}\n👤 المستشار: ${meeting.consultant.name}`;
  },

  // 💼 consultant meetings
  async consultant_meetings(from) {
    // get role
    if (sessionUser.get(from)?.role !== UserRole.OWNER)
      return "هذه المعلومات خاصة فقط بالمستشارين 🔒";

    // date
    const { date, time } = timeZone();

    // get meeting
    const meetings = await BotConsultantOrder(from, date, time);

    // validate
    if (!meetings?.length) return "ما عندك جلسات مجدولة حالياً 📭";

    // meetings lines
    const lines = meetings.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) =>
        `🗓️ جلسة #${m.oid}\n${meetingLabel(
          m.meeting[0].time,
          m.meeting[0].date,
        )}\n👥 العميل: ${m.name || m.phone}`,
    );

    // return
    return "مواعيدك القادمة:\n" + lines.join("\n\n");
  },

  // 💰 consultant dues
  async consultant_dues(from) {
    // get role
    if (sessionUser.get(from)?.role !== UserRole.OWNER)
      return "هذه المعلومات خاصة فقط بالمستشارين 🔒";

    // date
    const { date } = timeZone();

    // get dues
    const dues = await BotConsultantDues(from, date);

    // validate
    if (!dues) return "ما لقيت بياناتك حالياً ⚙️";

    return `💰 مستحقاتك لهذا الشهر: ${dues} ريال سعودي`;
  },

  // 🧾 consultant info (placeholder)
  async consultant_info(from) {
    // get role
    if (sessionUser.get(from)?.role !== UserRole.OWNER)
      return "هذه المعلومات خاصة فقط بالمستشارين 🔒";

    // get data
    const consultant = await BotGetConsultantData(from);

    // validate
    if (!consultant) return "ما لقيت بياناتك حالياً ⚙️";

    // label
    const genderLabel = consultant.gender === "MALE" ? "المستشار" : "المستشارة";

    // link
    const link = `https://shwerni.sa/consultant/${consultant.cid}`;

    // return
    return `${genderLabel} ${consultant.name}\nرقم المستشار: #${
      consultant.cid
    }\n🔗 رابط الملف:\n ${link}\n\n📁 حالة اعتماد الملف:\n ${
      findApprovalState(consultant.approved)?.label
    }\n\n⚙️ حالة الحساب:\n ${findConsultantState(consultant.statusA)?.label}`;
  },
};

// extract
export const oExtractJson = async (text: string) => {
  // match json
  const match = text.match(/\{[\s\S]*\}/);
  // extract json
  return match ? JSON.parse(match[0]) : null;
};

export async function handleBotReply(
  fromId: string,
  message: string,
  user: User | undefined,
  displayName: string,
) {
  try {
    // store chat message in memory
    let history = userChatHistory.get(fromId) || [];

    // push new message
    history.push({ sender: "user", message });

    // trim old messages
    if (history.length > max) history = history.slice(-max);

    // save back
    userChatHistory.set(fromId, history);

    // build prompt for AI with context
    const conversation = history
      .map(
        (m) =>
          `${m.sender === "user" ? displayName : "شاورني - bot"}: ${m.message}`,
      )
      .join("\n");

    // input
    const input = JSON.stringify({
      name: displayName,
      message: message,
      role: user?.role === UserRole.OWNER ? UserRole.OWNER : UserRole.USER,
      conversationhistory: conversation,
    });

    // get ai replay
    const botResponse = await AiBot(input);

    // parsed
    const parsed = (await oExtractJson(botResponse)) || {};

    // replay
    const { reply, messageType, actionName } = parsed;

    // add bot message to history
    if (reply) {
      history.push({ sender: "bot", message: reply });
      if (history.length > max) history = history.slice(-max);
      userChatHistory.set(fromId, history);
    }

    // If normal message — just reply
    if (messageType !== "ACTION") {
      // upsert bot message
      await upsertWhatsappChat(fromId, "966553689116", displayName, reply);
      // replay
      return reply;
    }

    // actions
    let actionResult = "ما فهمت الإجراء المطلوب 🤔";

    // action handler
    const handler = botActions[actionName as BotActions];

    // get handler
    if (handler) {
      try {
        actionResult = await handler(fromId);
      } catch {
        actionResult = "حدث خطأ أثناء تنفيذ العملية ⚠️";
      }
    }

    // send bot reply
    if (reply) {
      // upseert bot message
      await upsertWhatsappChat(fromId, "966553689116", displayName, reply);
    }

    if (actionResult) {
      // upseert bot message
      await upsertWhatsappChat(
        fromId,
        "966553689116",
        displayName,
        actionResult,
      );
    }

    return reply;
  } catch (error) {
    await telegramAdmin(String(error));
    return `حدث خطأ غير متوقع. يرجى المحاولة لاحقاً ⚙️\nالدعم الفني: https://wa.me/966554117879`;
  }
}
