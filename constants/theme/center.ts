// constants/theme/center.ts
// center accent palettes (centers spec §13). the page stays neutral; the palette only colors
// buttons, active states, icon squares and small highlights.
//   accent            primary buttons, active states
//   accentForeground  text on accent (AA ≥ 4.5:1)
//   accentText        accent-colored text and icons on white or tint (AA ≥ 4.5:1)
//   tint              icon-square background, badges
//   soft              the lightest wash: hero gradient, highlighted rows
export const centerPalettes = {
  emerald: {
    accent: "#047857",
    accentForeground: "#ffffff",
    accentText: "#047857",
    tint: "#d1fae5",
    soft: "#ecfdf5",
  },
  teal: {
    accent: "#0f766e",
    accentForeground: "#ffffff",
    accentText: "#0f766e",
    tint: "#ccfbf1",
    soft: "#f0fdfa",
  },
  sky: {
    accent: "#0369a1",
    accentForeground: "#ffffff",
    accentText: "#0369a1",
    tint: "#e0f2fe",
    soft: "#f0f9ff",
  },
  indigo: {
    accent: "#4f46e5",
    accentForeground: "#ffffff",
    accentText: "#4338ca",
    tint: "#e0e7ff",
    soft: "#eef2ff",
  },
  violet: {
    accent: "#7c3aed",
    accentForeground: "#ffffff",
    accentText: "#6d28d9",
    tint: "#ede9fe",
    soft: "#f5f3ff",
  },
  rose: {
    accent: "#e11d48",
    accentForeground: "#ffffff",
    accentText: "#be123c",
    tint: "#ffe4e6",
    soft: "#fff1f2",
  },
  amber: {
    accent: "#f59e0b",
    accentForeground: "#1c1917",
    accentText: "#b45309",
    tint: "#fef3c7",
    soft: "#fffbeb",
  },
  slate: {
    accent: "#1e293b",
    accentForeground: "#ffffff",
    accentText: "#334155",
    tint: "#e2e8f0",
    soft: "#f8fafc",
  },
} as const;

export type CenterPaletteKey = keyof typeof centerPalettes;
export type CenterPalette = { [K in keyof (typeof centerPalettes)["indigo"]]: string };

// keys stored before the palettes existed (Center.themeKey defaults to "midnight")
export const legacyPaletteKeys: Record<string, CenterPaletteKey> = {
  midnight: "indigo",
};

export const defaultCenterPalette: CenterPaletteKey = "indigo";
