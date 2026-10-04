// constants/theme/center.ts
// center themes (centers spec §13). the page stays neutral; color is used sparingly:
//   primary           CTA buttons, active states
//   primaryForeground text on primary (AA ≥ 4.5:1)
//   secondary         icons and text of chips, badges and icon squares (a different but
//                     harmonious hue, or a neutral), AA ≥ 4.5:1 on secondarySoft and on white
//   secondarySoft     background of those chips and icon squares
//   accent            a faint wash for soft backgrounds (compact hero, today's row)
export const centerThemes = {
  night: {
    name: "ليلي",
    primary: "#0f172a",
    primaryForeground: "#ffffff",
    secondary: "#475569",
    secondarySoft: "#f1f5f9",
    accent: "#eff6ff",
  },
  emerald: {
    name: "زمردي",
    primary: "#047857",
    primaryForeground: "#ffffff",
    secondary: "#57534e",
    secondarySoft: "#f5f5f4",
    accent: "#ecfdf5",
  },
  ocean: {
    name: "محيطي",
    primary: "#0369a1",
    primaryForeground: "#ffffff",
    secondary: "#0f766e",
    secondarySoft: "#f0fdfa",
    accent: "#f0f9ff",
  },
  royal: {
    name: "ملكي",
    primary: "#4338ca",
    primaryForeground: "#ffffff",
    secondary: "#a16207",
    secondarySoft: "#fefce8",
    accent: "#eef2ff",
  },
  lavender: {
    name: "بنفسجي",
    primary: "#6d28d9",
    primaryForeground: "#ffffff",
    secondary: "#be185d",
    secondarySoft: "#fdf2f8",
    accent: "#f5f3ff",
  },
  rose: {
    name: "وردي",
    primary: "#be123c",
    primaryForeground: "#ffffff",
    secondary: "#57534e",
    secondarySoft: "#f5f5f4",
    accent: "#fff1f2",
  },
  desert: {
    name: "صحراوي",
    primary: "#b45309",
    primaryForeground: "#ffffff",
    secondary: "#0f766e",
    secondarySoft: "#f0fdfa",
    accent: "#fffbeb",
  },
  olive: {
    name: "زيتوني",
    primary: "#3f6212",
    primaryForeground: "#ffffff",
    secondary: "#92400e",
    secondarySoft: "#fffbeb",
    accent: "#f7fee7",
  },
} as const;

export type CenterThemeKey = keyof typeof centerThemes;

// the colors of a theme (its display name aside)
export type CenterThemeColors = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
};

// keys stored before these themes existed (Center.themeKey defaults to "midnight")
export const legacyThemeKeys: Record<string, CenterThemeKey> = {
  midnight: "night",
  slate: "night",
  indigo: "royal",
  violet: "lavender",
  sky: "ocean",
  teal: "ocean",
  amber: "desert",
};

export const defaultCenterTheme: CenterThemeKey = "night";
