"use server";
// lib
import { sendWhatsappTemplate } from "../api/whatsapp";

// utils
import { wTemplatePreConsultationResponse, wTemplateTest } from "@/utils/templates/whatsapp/whatsapp";


// whatsapp test notification
export const notificationWTesting = async (phone: string) => {
  try {
    // send test
    await sendWhatsappTemplate(phone, "testing", "en_us", wTemplateTest(phone));
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// pre consultation response notification
export const notificationWPreConsultationResponse = async (
  id: string,
  phone: string,
  name: string,
  advisor: string,
  pid: number
) => {
  try {
    // send test
    await sendWhatsappTemplate(
      phone,
      "preconsultation_response",
      "ar",
      wTemplatePreConsultationResponse(id, name, advisor, pid)
    );
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// send otp code message // later
// export const orderRefundNotification = async ();

// review reminder // later
// export const sendReviewReminder = async ();

// unpaid order reminder // later
// export const unPaidReminder = async ();

// unpaid order reminder // later
// export const orderBriefNotification = async ());
