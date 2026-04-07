"use server";
// endpoint
const url = "https://api-sms.4jawaly.com/api/v1/account/area/sms/send";

// auth
const auth = Buffer.from(
  `${process.env.JAWALY_KEY}:${process.env.JAWALY_SECRET}`
).toString("base64");

// template sending
export const smsSending = async (to: string, message: string) => {
  // send sms
  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        messages: [
          {
            text: message,
            numbers: [to],
            number_iso: "SA",
            sender: "shwerni",
          },
        ],
      }),
    });

    // return
    return response.json();
  } catch {
    // return
    return null;
  }
};