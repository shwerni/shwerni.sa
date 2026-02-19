import { encryptToken } from "../../admin/encryption";

// test sending whatsapp template
export const wTemplateTest = (phone: string) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(phone),
        },
      ],
    },
  ];
  //  return
  return components;
};

// test sending whatsapp template
export const wTemplateSecurityOtp = (otp: string | number) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(otp),
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: String(otp),
        },
      ],
    },
  ];
  //  return
  return components;
};

// new order client template
export const wTemplateNewOrderClient = (
  oid: number,
  name: string,
  coname: string,
  total: number,
  duration: string | number,
  label: string,
  zid: string
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(oid),
        },
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: total.toFixed(2),
        },
        {
          type: "text",
          text: duration,
        },
        {
          type: "text",
          text: label ?? "",
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${zid}?participant=client`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// new order owner template
export const wTemplateNewOrderOwner = (
  oid: number,
  coname: string,
  name: string,
  duration: string | number,
  label: string,
  zid: string
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(oid),
        },
        {
          type: "text",
          text: duration,
        },
        {
          type: "text",
          text: label ?? "",
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${zid}?participant=owner`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// pre consultation response notification
export const wTemplatePreConsultationResponse = (
  id: string,
  name: string,
  advisor: string,
  pid: number
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(pid),
        },
        {
          type: "text",
          text: String(advisor),
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: encryptToken(id),
        },
      ],
    },
  ];
  // return
  return components;
};

// new owner notification template
export const wTemplateNewOwner = (name: string, cid: string) => {
  // component
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(name),
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 1,
      parameters: [
        {
          type: "text",
          text: `${cid}`,
        },
      ],
    },
  ];
  // return
  return components;
};

// new preconsultation notification template
export const wTemplateNewPreConsultation = (
  advisor: string,
  name: string,
  pid: number
) => {
  // component
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(advisor),
        },
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(pid),
        },
      ],
    },
  ];
  // return
  return components;
};

// new freesession owner template
export const wTemplateNewFreeSessionOwner = (
  fid: number,
  coname: string,
  name: string,
  duration: string | number,
  label: string,
  zid: string
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(fid),
        },
        {
          type: "text",
          text: duration,
        },
        {
          type: "text",
          text: label ?? "",
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${zid}?participant=owner`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// new order client template
export const wTemplateNewFreeSessionClient = (
  fid: number,
  name: string,
  coname: string,
  duration: string | number,
  label: string,
  zid: string
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(fid),
        },
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: duration,
        },
        {
          type: "text",
          text: label ?? "",
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${zid}?participant=client`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// new gift order
export const wTemplateNewGiftOrder = (
  oid: number,
  name: string,
  guest: string,
  coname: string,
  duration: string,
  sessions: number,
  label: string,
  zid: string
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(guest),
        },
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(oid),
        },
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: duration,
        },
        {
          type: "text",
          text: sessions,
        },
        {
          type: "text",
          text: label,
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${zid}?participant=client`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// new gift order confirm
export const wTemplateNewGiftOrderConfirm = (
  oid: number,
  guest: string,
  name: string,
  coname: string,
  total: number
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(guest),
        },
        {
          type: "text",
          text: String(name),
        },
        {
          type: "text",
          text: String(oid),
        },
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: total.toFixed(2),
        },
        {
          type: "text",
          text: String(name),
        },
      ],
    },
  ];
  //  return
  return components;
};
