"use server";
// packages
import axios from "axios";

// endpoint
const url = "https://api-sms.4jawaly.com/api/v1/account/area/sms/send";

// auth
const auth = Buffer.from(
  `${process.env.JAWALY_KEY}:${process.env.JAWALY_SECRET}`
).toString("base64");

// whatsapp api
const sms = axios.create({
  baseURL: url,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  },
});

// template sending
export const smsSending = async (to: string, message: string) => {
  // send sms
  try {
    const response = await sms.post("", {
      messages: [
        {
          text: message,
          numbers: [to],
          number_iso: "SA",
          sender: "shwerni",
        },
      ],
    });
    //  return
    return response.data;
  } catch {
    //  return
    return null;
  }
};
