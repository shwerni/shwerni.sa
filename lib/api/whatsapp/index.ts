"use server";
// whatsapp config
const WHATSAPP_URL = process.env.WHATSAPP_URL!; // e.g. https://graph.facebook.com/v21.0/586473104542070/
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;

// Build the endpoint safely regardless of whether WHATSAPP_URL has a
// trailing slash - string concatenation without this guard silently
// produces a broken URL like ".../586473104542070marketing_messages".
function buildEndpoint(marketing: boolean) {
  const base = WHATSAPP_URL.endsWith("/") ? WHATSAPP_URL : `${WHATSAPP_URL}/`;
  return base + (marketing ? "marketing_messages" : "messages");
}

// whatsapp api
const whatsapp = (body: object, marketing: boolean = false) =>
  fetch(buildEndpoint(marketing), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

// types
export type HeaderParam =
  | { type: "image"; value: string }
  | { type: "video"; value: string }
  | { type: "document"; value: string }
  | { type: "text"; value: string };

export type TemplateParams = {
  header?: HeaderParam;
  text?: (string | number)[];
  url?: string[];
  quick_reply?: string[];
  flow?: { index?: number; flow_token: string };
};

// Structured result so callers (especially the cron job) can tell WHY a
// send failed instead of getting back null with zero information.
export type WhatsappSendResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      httpStatus?: number;
      errorCode?: number;
      errorMessage: string;
      raw?: unknown;
    };

/**
 * Which Cloud API endpoint to hit depends on the WhatsApp template
 * CATEGORY, not on how you feel like sending it:
 *  - MARKETING templates -> /marketing_messages  (marketing: true)
 *  - UTILITY / AUTHENTICATION / plain text       -> /messages (marketing: false)
 * Sending a marketing-category template through /messages (or vice versa)
 * is what gets flagged/throttled, so this flag should be driven by the
 * template's actual approved category, not set ad hoc per call.
 */
export const sendWhatsappTemplate = async (
  to: string,
  template: string,
  params: TemplateParams,
  language = "ar",
  marketing: boolean = false,
): Promise<WhatsappSendResult> => {
  const components = [];

  if (params.header) {
    if (params.header.type === "text") {
      components.push({
        type: "header",
        parameters: [{ type: "text", text: params.header.value }],
      });
    } else {
      components.push({
        type: "header",
        parameters: [
          {
            type: params.header.type,
            [params.header.type]: { link: params.header.value },
          },
        ],
      });
    }
  }

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

  if (!WHATSAPP_URL || !WHATSAPP_TOKEN) {
    return {
      ok: false,
      errorMessage: "WHATSAPP_URL or WHATSAPP_TOKEN env var is missing/empty",
    };
  }

  try {
    const res = await whatsapp(
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components,
        },
      },
      marketing,
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        httpStatus: res.status,
        errorCode: data?.error?.code,
        errorMessage:
          data?.error?.message ||
          res.statusText ||
          "Unknown WhatsApp API error",
        raw: data,
      };
    }

    return { ok: true, data };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      ok: false,
      errorMessage: err?.message || "Network/fetch error calling WhatsApp API",
    };
  }
};

// send text message (always goes through /messages - text messages are
// session/utility-type, never marketing)
export const sendWhatsappText = async (
  phone: string,
  text: string,
): Promise<WhatsappSendResult> => {
  if (!WHATSAPP_URL || !WHATSAPP_TOKEN) {
    return {
      ok: false,
      errorMessage: "WHATSAPP_URL or WHATSAPP_TOKEN env var is missing/empty",
    };
  }

  try {
    const res = await whatsapp({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        httpStatus: res.status,
        errorCode: data?.error?.code,
        errorMessage:
          data?.error?.message ||
          res.statusText ||
          "Unknown WhatsApp API error",
        raw: data,
      };
    }

    return { ok: true, data };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      ok: false,
      errorMessage: err?.message || "Network/fetch error calling WhatsApp API",
    };
  }
};
