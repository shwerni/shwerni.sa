// a template message's components from a send's params: the header, the body text, and the
// url / quick_reply / copy_code / flow buttons. pure (no env, no fetch) so the payload the cron
// sends can be checked. a coupon meta would refuse fails here, before any call

// types
export type HeaderParam =
  | { type: "image"; value: string }
  | { type: "video"; value: string }
  // a document by public link (value), or by an uploaded media id (id)
  | { type: "document"; value: string; filename?: string }
  | { type: "document"; id: string; filename?: string }
  | { type: "text"; value: string };

export type TemplateParams = {
  header?: HeaderParam;
  text?: (string | number)[];
  url?: string[];
  quick_reply?: string[];
  flow?: { index?: number; flow_token: string };
  // a copy-code button: one code, at the button's position in the template (default 0)
  coupon?: { code: string; index?: number };
};

// meta's limit for a copy_code button's coupon_code
export const COUPON_CODE_MAX = 15;

// why a coupon param can't be sent, or null. the campaign's params are stored json, so the shape
// is checked here too: one object (never a list), a 1–15 character code, a button index 0–9
export function couponError(coupon: unknown): string | null {
  if (coupon === undefined || coupon === null) return null;
  if (Array.isArray(coupon)) return "coupon: at most one coupon per template";
  if (typeof coupon !== "object") return "coupon: expected { code, index }";
  const { code, index } = coupon as { code?: unknown; index?: unknown };
  if (typeof code !== "string" || code.trim().length === 0)
    return "coupon: the code is empty";
  if (code.trim().length > COUPON_CODE_MAX)
    return `coupon: the code "${code.trim()}" is longer than ${COUPON_CODE_MAX} characters`;
  if (index !== undefined && (!Number.isInteger(index) || (index as number) < 0 || (index as number) > 9))
    return "coupon: the button index must be a whole number from 0 to 9";
  return null;
}

export type BuiltComponents =
  | { ok: true; components: object[] }
  | { ok: false; errorMessage: string };

export function buildTemplateComponents(params: TemplateParams): BuiltComponents {
  const invalid = couponError(params.coupon);
  if (invalid) return { ok: false, errorMessage: invalid };

  const components = [];

  if (params.header) {
    if (params.header.type === "text") {
      components.push({
        type: "header",
        parameters: [{ type: "text", text: params.header.value }],
      });
    } else {
      const header = params.header;
      components.push({
        type: "header",
        parameters: [
          {
            type: header.type,
            [header.type]: {
              ...("id" in header ? { id: header.id } : { link: header.value }),
              // a document can carry the file name the client sees
              ...(header.type === "document" &&
                header.filename && { filename: header.filename }),
            },
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

  // a copy-code button carries its code as a coupon_code parameter: as body text (#132000) or
  // a url param (#131008) meta refuses it
  if (params.coupon) {
    components.push({
      type: "button",
      sub_type: "copy_code",
      index: params.coupon.index ?? 0,
      parameters: [{ type: "coupon_code", coupon_code: params.coupon.code.trim() }],
    });
  }

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

  return { ok: true, components };
}
