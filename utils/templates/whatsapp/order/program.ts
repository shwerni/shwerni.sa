// new order owner template
export const wTemplateNewProgramOrderOwner = (
  oid: number,
  program: string,
  coname: string,
  name: string,
  session: number,
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
          text: String(program),
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
          text: String(session),
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
          text: `${zid}?participant=owner&session=1`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// program confirm consultant/clinet
export const wTemplateProgramConfirm = (
  isConsultant: boolean,
  oid: number,
  program: string,
  name: string,
  partner: string,
  session: number,
  sessionCount: number,
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
          text: String(program),
        },
        {
          type: "text",
          text: String(partner),
        },
        {
          type: "text",
          text: String(oid),
        },
        {
          type: "text",
          text: String(session),
        },
        {
          type: "text",
          text: String(sessionCount),
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
          text: `${zid}?participant=${isConsultant ? "owner" : "client"}&session=${session}`,
        },
      ],
    },
  ];
  //  return
  return components;
};

// program clinet choose
export const wTemplateProgramSession = (
  oid: number,
  program: string,
  coname: string,
  session: number,
  czid: string,
) => {
  // test components
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: String(session),
        },
        {
          type: "text",
          text: String(program),
        },
        {
          type: "text",
          text: String(coname),
        },
        {
          type: "text",
          text: String(oid),
        }
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: `${czid}?session=${session}`,
        },
      ],
    },
  ];
  //  return
  return components;
};
