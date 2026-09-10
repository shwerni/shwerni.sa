// constants/theme/event.ts
export const themes = {
  midnight: {
    from: "#020d1a",
    via: "#0a2540",
    to: "#0f5ca3",
    accent: "#117ed8",
    glow: "#06b6d4",
  },
  violet: {
    from: "#0f172a",
    via: "#312e81",
    to: "#4c1d95",
    accent: "#6366f1",
    glow: "#c084fc",
  },
  emerald: {
    from: "#022c22",
    via: "#065f46",
    to: "#059669",
    accent: "#34BE8F",
    glow: "#6ee7b7",
  },
} as const;

export type ThemeKey = keyof typeof themes;
export type Theme = (typeof themes)[ThemeKey];

export const themeKeys = Object.keys(themes) as ThemeKey[];
