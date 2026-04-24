"use server";

// prisma types
import {
  FreeSession,
  OrderType,
  SessionType,
} from "@/lib/generated/prisma/client";

// lib
import { sendWhatsappTemplate } from "@/lib/api/whatsapp";

// utils
import { meetingLabel } from "@/utils/time";
import { encryptionDigitsToUrl, zencryption } from "@/utils/admin/encryption";

// types
import { Reservation } from "@/types/admin";

// helper — wraps every notification in try/catch
const notify = async (fn: () => Promise<void>) => {
  try {
    await fn();
    return true;
  } catch {
    return null;
  }
};

// otp sending
export const notificationSecurityOtp = async (
  phone: string,
  name: string,
  otp: string | number,
) => {
  const sotp = String(otp);
  await sendWhatsappTemplate(phone, "new_confirm", {
    text: [name, sotp],
  });
  await sendWhatsappTemplate(phone, "security_otp", {
    text: [sotp],
    url: [sotp],
  });
};

// new order notification
export const notificationNewOrder = async (order: Reservation) => {
  // meeting
  const meeting = order.meeting;
  // payment
  const payment = order.payment;
  // program
  const program = order.program;
  // consultant name
  const coname = order.consultant.name;
  // consultant phone
  const cophone = order.consultant.phone;
  // session type
  const isProgram = order.session === SessionType.MULTIPLE;

  // validate
  if (!meeting || !payment || (isProgram && !program)) return;

  // zid
  const zid = zencryption(order.oid);
  // meeting label
  const label = meetingLabel(meeting[0].time, meeting[0].date);

  return notify(async () => {
    // if program or single
    if (isProgram && program) {
      // owner
      await sendWhatsappTemplate(
        cophone,
        "program_owner_new",
        {
          text: [
            coname,
            program.title,
            order.name,
            order.oid,
            order.sessionCount,
            label,
          ],
          url: [`${zid}?participant=owner&session=1`],
        },
        "en_us",
      );
      // client
      await sendWhatsappTemplate(
        order.phone,
        "program_session_confirm",
        {
          text: [
            program.title,
            order.name,
            coname,
            order.oid,
            1,
            program.sessions,
            label,
          ],
          url: [`${zid}?participant=client&session=1`],
        },
        "en_us",
      );
      return;
    }

    // scale
    if (order.scaleId) {
      // scale url
      const scale = encryptionDigitsToUrl(order.oid);

      await sendWhatsappTemplate(order.phone, "scale_reminder", {
        text: [order.name, coname, `/scales/orders/${scale}`],
        url: [scale],
      });
    }

    // if order instant
    if (order.type === OrderType.INSTANT) {
      // owner
      await sendWhatsappTemplate(cophone, "order_new_instant_owner", {
        text: [coname, order.name, order.oid, meeting[0].duration, label],
        quick_reply: [`meeting-url:${meeting[0].mid}`],
      });
      // client
      await sendWhatsappTemplate(order.phone, "order_new_instant_client", {
        text: [
          order.name,
          order.oid,
          coname,
          payment.total.toFixed(2),
          meeting[0].duration,
          label,
        ],
        quick_reply: [`meeting-url:${meeting[0].mid}`],
      });
      return;
    }

    // if gifted
    if (order.guest && order.gift) {
      // owner
      await sendWhatsappTemplate(cophone, "order_new_owner", {
        text: [coname, order.name, order.oid, meeting[0].duration, label],
        quick_reply: [`meeting-url:${meeting[0].mid}`],
      });
      // send to the client gifted to (the one will take the session)
      await sendWhatsappTemplate(
        order.phone,
        "order_new_gift",
        {
          text: [
            order.name,
            order.guest.name,
            order.oid,
            coname,
            meeting[0].duration,
            meeting[0].session,
            label,
          ],
          // later edit template to match quick reply
          quick_reply: [`meeting-url:${meeting[0].mid}`],
        },
        "en_us",
      );
      // confirm payment to the client who paid
      await sendWhatsappTemplate(order.guest.phone, "order_new_gift_confirm", {
        text: [
          order.guest.name,
          order.name,
          order.oid,
          coname,
          payment.total,
          order.name,
        ],
      });
      return;
    }

    // ordinary order
    // owner
    await sendWhatsappTemplate(cophone, "order_new_owner", {
      text: [coname, order.name, order.oid, meeting[0].duration, label],
      quick_reply: [`meeting-url:${meeting[0].mid}`],
    });
    // client
    await sendWhatsappTemplate(order.phone, "order_new_client", {
      text: [
        order.name,
        order.oid,
        coname,
        payment.total,
        meeting[0].duration,
        label,
      ],
      quick_reply: [`meeting-url:${meeting[0].mid}`],
    });
  });
};

// new owner welcome notification
export const notificationNewOwner = async (
  phone: string,
  name: string,
  cid: string,
) =>
  notify(() =>
    sendWhatsappTemplate(phone, "owner_new_approved", {
      text: [name],
      url: [cid],
    }),
  );

// new pre-consultation session
export const notificationNewPreConsultation = async (
  phone: string,
  name: string,
  advisor: string,
  pid: number,
) =>
  notify(() =>
    sendWhatsappTemplate(phone, "preconsultation_new", {
      text: [advisor, name, pid],
    }),
  );

// new free session notification
export const notificationNewFreeSession = async (
  coname: string,
  cophone: string,
  session: FreeSession,
) => {
  // zid
  const zid = zencryption(session.fid);
  // meeting label
  const label = meetingLabel(session.time, session.date);

  return notify(async () => {
    // owner
    await sendWhatsappTemplate(cophone, "freesession_new_owner", {
      text: [coname, session.name, session.fid, session.duration, label],
      // later edit template to match quick reply
      // quick_reply: [`meeting-url:${meeting[0].mid}`],
      url: [zid],
    });
    // client
    await sendWhatsappTemplate(
      session.phone,
      "freesession_new_client",
      {
        text: [session.name, session.fid, coname, session.duration, label],
        // later edit template to match quick reply
        // quick_reply: [`meeting-url:${meeting[0].mid}`],
        url: [zid],
      },
      "en_us",
    );
  });
};

// program next session selection notification
export const notificationPickNewSession = async (
  phone: string,
  oid: number,
  consultant: string,
  program: string,
  session: number,
) => {
  // zid
  const czid = encryptionDigitsToUrl(oid);

  return notify(() =>
    // send to client
    sendWhatsappTemplate(phone, "program_session_select", {
      text: [session, program, consultant, oid],
      url: [`${czid}?session=${session}`],
    }),
  );
};

// new program session confirm notification
export const notificationSessionConfirm = async (
  oid: number,
  mid: string,
  program: string,
  name: string,
  coname: string,
  phone: string,
  cophone: string,
  session: number,
  sessions: number,
  time: string,
  date: string,
) => {
  // meeting label
  const label = meetingLabel(time, date);

  // program
  return notify(async () => {
    // client
    await sendWhatsappTemplate(
      phone,
      "program_session_confirm",
      {
        text: [
          name,
          program,
          `المستشار ${coname}`,
          oid,
          session,
          sessions,
          label,
        ],
        quick_reply: [`meeting-url:${mid}`],
      },
      "en_us",
    );
    // owner
    await sendWhatsappTemplate(
      cophone,
      "program_session_confirm",
      {
        text: [
          coname,
          program,
          `العميل ${name}`,
          oid,
          session,
          sessions,
          label,
        ],
        quick_reply: [`meeting-url:${mid}`],
      },
      "en_us",
    );
  });
};

// review reminder
export const notificationReviewReminder = async (
  oid: number,
  phone: string,
  consultant: string,
  date: string,
  time: string,
) => {
  // meeting label
  const label = meetingLabel(time, date);

  // send client
  return sendWhatsappTemplate(phone, "review_reminder", {
    text: [consultant, "#" + oid, label],
    flow: { flow_token: String(oid) },
  });
};

// scale reminder
export const notificationScaleReminder = async (
  oid: number,
  phone: string,
  name: string,
  consultant: string,
) => {
  // scale url
  const scale = encryptionDigitsToUrl(oid);

  // send
  await sendWhatsappTemplate(phone, "scale_result", {
    text: [consultant, name, oid, `/scales/results/${scale}`],
    url: [scale],
  });
};
