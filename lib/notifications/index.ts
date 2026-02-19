"use server";
// prisam types
import {
  FreeSession,
  OrderType,
  SessionType,
} from "@/lib/generated/prisma/client";

// lib
import { sendWhatsappTemplate } from "@/lib/api/whatsapp";

// utils
import { meetingLabel } from "@/utils/moment";
import { encryptionDigitsToUrl, zencryption } from "@/utils/admin/encryption";

// templates
import {
  wTemplateNewOwner,
  wTemplateSecurityOtp,
  wTemplateNewOrderOwner,
  wTemplateNewOrderClient,
  wTemplateNewPreConsultation,
  wTemplateNewFreeSessionOwner,
  wTemplateNewFreeSessionClient,
  wTemplateNewGiftOrderConfirm,
  wTemplateNewGiftOrder,
} from "@/utils/templates/whatsapp/whatsapp";
import {
  wTemplateNewProgramOrderOwner,
  wTemplateProgramConfirm,
  wTemplateProgramSession,
} from "@/utils/templates/whatsapp/order/program";

// types
import { Reservation } from "@/types/admin";

// otp sending
export const notificationSecurityOtp = async (
  phone: string,
  otp: string | number,
) => {
  try {
    // send to owner
    await sendWhatsappTemplate(
      phone,
      "security_otp",
      "ar",
      wTemplateSecurityOtp(otp),
    );
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new order notification
export const notificationNewOrder = async (order: Reservation) => {
  try {
    // meeting
    const meeting = order.meeting;
    // payment
    const payment = order.payment;
    // program
    const program = order.program;
    // consultant name
    const coname = order.consultant.name;
    // consultnat phone
    const cophone = order.consultant.phone;
    // session type
    const isProgram = order.session === SessionType.MULTIPLE;

    // validate
    if (!meeting || !payment || (isProgram && !program)) return;

    // zid
    const zid = zencryption(order.oid);

    // meeting label
    const label = meetingLabel(meeting[0].time, meeting[0].date) || "";

    // if program or single
    if (isProgram && program) {
      // owner
      await sendWhatsappTemplate(
        cophone,
        "program_owner_new",
        "en_us",
        wTemplateNewProgramOrderOwner(
          order.oid,
          program.title,
          coname,
          order.name,
          order.sessionCount,
          label,
          zid,
        ),
      );
      // client
      await sendWhatsappTemplate(
        order.phone,
        "program_session_confirm",
        "en_us",
        wTemplateProgramConfirm(
          false,
          order.oid,
          program.title,
          order.name,
          coname,
          1,
          program.sessions,
          label,
          zid,
        ),
      );
      // return
      return true;
    }

    // if order instant
    if (order.type === OrderType.INSTANT) {
      // owner
      await sendWhatsappTemplate(
        cophone,
        "order_new_instant_owner",
        "ar",
        wTemplateNewOrderOwner(
          order.oid,
          coname,
          order.name,
          meeting[0].duration,
          label,
          zid,
        ),
      );
      // send to client
      await sendWhatsappTemplate(
        order.phone,
        "order_new_instant_client",
        "ar",
        wTemplateNewOrderClient(
          order.oid,
          order.name,
          coname,
          payment.total,
          meeting[0].duration,
          label,
          zid,
        ),
      );
      // return
      return true;
    }

    // if gifted
    if (order.guest && order.gift) {
      // owner
      await sendWhatsappTemplate(
        cophone,
        "order_new_owner",
        "ar",
        wTemplateNewOrderOwner(
          order.oid,
          coname,
          order.name,
          meeting[0].duration,
          label,
          zid,
        ),
      );
      // send to the client gifted to (the one will take the session)
      await sendWhatsappTemplate(
        order.phone,
        "order_new_gift",
        "en_us",
        wTemplateNewGiftOrder(
          order.oid,
          order.name,
          order.guest.name,
          coname,
          meeting[0].duration,
          meeting[0].session,
          label,
          zid,
        ),
      );
      // confirm payment to the client pay
      await sendWhatsappTemplate(
        order.guest.phone,
        "order_new_gift_confirm",
        "ar",
        wTemplateNewGiftOrderConfirm(
          order.oid,
          order.guest.name,
          order.name,
          coname,
          payment.total,
        ),
      );
      // return
      return true;
    }

    // if ordinary order
    // owner
    await sendWhatsappTemplate(
      cophone,
      "order_new_owner",
      "ar",
      wTemplateNewOrderOwner(
        order.oid,
        coname,
        order.name,
        meeting[0].duration,
        label,
        zid,
      ),
    );
    // send to client
    await sendWhatsappTemplate(
      order.phone,
      "order_new_client",
      "ar",
      wTemplateNewOrderClient(
        order.oid,
        order.name,
        coname,
        payment.total,
        meeting[0].duration,
        label,
        zid,
      ),
    );

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new owner welcome notification
export const notificationNewOwner = async (
  phone: string,
  name: string,
  cid: string,
) => {
  try {
    // send owner
    await sendWhatsappTemplate(
      phone,
      "owner_new_approved",
      "ar",
      wTemplateNewOwner(name, cid),
    );
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new preConsultion session
export const notificationNewPreConsultation = async (
  phone: string,
  name: string,
  advisor: string,
  pid: number,
) => {
  try {
    // send owner
    await sendWhatsappTemplate(
      phone,
      "preconsultation_new",
      "ar",
      wTemplateNewPreConsultation(advisor, name, pid),
    );
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new order notification
export const notificationNewFreeSession = async (
  coname: string,
  cophone: string,
  session: FreeSession,
) => {
  try {
    // zid
    const zid = zencryption(session.fid);
    // meeting label
    const label = meetingLabel(session.time, session.date);
    // owner
    await sendWhatsappTemplate(
      cophone,
      "freesession_new_owner",
      "ar",
      wTemplateNewFreeSessionOwner(
        session.fid,
        coname,
        session.name,
        session.duration,
        label,
        zid,
      ),
    );
    // send to client
    await sendWhatsappTemplate(
      session.phone,
      "freesession_new_client",
      "en_us",
      wTemplateNewFreeSessionClient(
        session.fid,
        session.name,
        coname,
        session.duration,
        label,
        zid,
      ),
    );

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new order notification
export const notificationProgramSession = async (
  order: Reservation,
  program: string,
  session: number,
) => {
  try {
    // zid
    const czid = encryptionDigitsToUrl(order.oid);

    // send to client
    await sendWhatsappTemplate(
      order.phone,
      "program_session_select",
      "ar",
      wTemplateProgramSession(
        order.oid,
        program,
        order.consultant.name,
        session,
        czid,
      ),
    );

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// new program session confirm notification
export const notificationProgramSessionConfirm = async (
  oid: number,
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
  try {
    // zid
    const zid = zencryption(oid);
    // meeting label
    const label = meetingLabel(time, date);
    // send clinet
    await sendWhatsappTemplate(
      phone,
      "program_session_confirm",
      "en_us",
      wTemplateProgramConfirm(
        false,
        oid,
        program,
        name,
        coname,
        session,
        sessions,
        label,
        zid,
      ),
    );
    // send owner
    await sendWhatsappTemplate(
      cophone,
      "program_session_confirm",
      "en_us",
      wTemplateProgramConfirm(
        true,
        oid,
        program,
        coname,
        name,
        session,
        sessions,
        label,
        zid,
      ),
    );
    // return
    return true;
  } catch {
    // return
    return null;
  }
};
