/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
// packages
import axios from "axios";

// whatsapp api
const whatsapp = axios.create({
  baseURL: process.env.WHATSAPP_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  },
});

// template sending
export const sendWhatsappTemplate = async (
  to: string,
  templateName: string,
  language: string,
  components: any[]
) => {
  // body
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  };
  try {
    // send whatsapp
    const response = await whatsapp.post("", body);
    //  return
    return response.data;
  } catch {    
    //  return
    return null;
  }
};

// send text message
export const sendWhatsappText = async (phone: string, text: string) => {
  try {
    // send
    await whatsapp.post("", {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    });

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// later
// export const sendWhatsappTemplate = async (
//   to: string,
//   template: string,
//   params: TemplateParams,
//   language = "ar",
// ) => {
//   const components = [];

//   if (params.text?.length) {
//     components.push({
//       type: "body",
//       parameters: params.text.map((t) => ({ type: "text", text: String(t) })),
//     });
//   }

//   params.url?.forEach((text, index) => {
//     components.push({
//       type: "button",
//       sub_type: "url",
//       index,
//       parameters: [{ type: "text", text }],
//     });
//   });

//   params.quick_reply?.forEach((payload, index) => {
//     components.push({
//       type: "button",
//       sub_type: "quick_reply",
//       index,
//       parameters: [{ type: "payload", payload }],
//     });
//   });

//   try {
//     const { data } = await whatsapp.post("", {
//       messaging_product: "whatsapp",
//       to,
//       type: "template",
//       template: {
//         name: template,
//         language: { code: language },
//         components,
//       },
//     });
//     return data;
//   } catch {
//     return null;
//   }
// };