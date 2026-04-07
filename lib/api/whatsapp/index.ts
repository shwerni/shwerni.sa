"use server";
// whatsapp config
const WHATSAPP_URL = process.env.WHATSAPP_URL!;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;

// whatsapp api
const whatsapp = (body: object) =>
  fetch(WHATSAPP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

// types
export type TemplateParams = {
  text?: (string | number)[];
  url?: string[];
  quick_reply?: string[];
  flow?: { index?: number; flow_token: string };
};

// send template message
export const sendWhatsappTemplate = async (
  to: string,
  template: string,
  params: TemplateParams,
  language = "ar",
) => {
  const components = [];

  if (params.text?.length) {
    components.push({
      type: "body",
      parameters: params.text.map((t) => ({ type: "text", text: String(t) })),
    });
  }

  params.url?.forEach((text, index) => {
    components.push({
      type: "button",
      sub_type: "url",
      index,
      parameters: [{ type: "text", text }],
    });
  });

  params.quick_reply?.forEach((payload, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index,
      parameters: [{ type: "payload", payload }],
    });
  });

  // flow button
  if (params.flow) {
    components.push({
      type: "button",
      sub_type: "flow",
      index: params.flow.index ?? 0,
      parameters: [
        {
          type: "action",
          action: { flow_token: String(params.flow.flow_token) },
        },
      ],
    });
  }

  try {
    const res = await whatsapp({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: language },
        components,
      },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
};

// send text message
export const sendWhatsappText = async (phone: string, text: string) => {
  try {
    // send
    const res = await whatsapp({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    });

    // return
    return res.ok ? true : null;
  } catch {
    // return
    return null;
  }
};
