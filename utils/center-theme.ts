// React & Next
import type { CSSProperties } from "react";

// constants
import {
  CenterThemeColors,
  CenterThemeKey,
  centerThemes,
  defaultCenterTheme,
  legacyThemeKeys,
} from "@/constants/theme/center";

// colors a center may override (centers spec §13)
const COLOR_KEYS = [
  "primary",
  "primaryForeground",
  "secondary",
  "secondarySoft",
  "accent",
] as const;

// colors only: #rgb, #rrggbb or #rrggbbaa
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// the theme of a key (legacy keys mapped, unknown keys fall back to the default)
const themeFor = (key?: string | null) => {
  const k = key ? (legacyThemeKeys[key] ?? key) : defaultCenterTheme;
  return centerThemes[k as CenterThemeKey] ?? centerThemes[defaultCenterTheme];
};

// a center's theme colors plus its overrides. unknown keys and non-color values are dropped,
// so stored theme data can never inject css
export const centerTheme = (
  key?: string | null,
  vars?: unknown,
): CenterThemeColors => {
  const preset = themeFor(key);
  const overrides =
    vars && typeof vars === "object" ? (vars as Record<string, unknown>) : {};

  return Object.fromEntries(
    COLOR_KEYS.map((k) => {
      const value = overrides[k];
      return [
        k,
        typeof value === "string" && HEX_COLOR.test(value) ? value : preset[k],
      ];
    }),
  ) as CenterThemeColors;
};

// the theme as css custom properties for the center wrapper
export const centerThemeStyle = (key?: string | null, vars?: unknown) => {
  const t = centerTheme(key, vars);
  return {
    "--center-primary": t.primary,
    "--center-primary-foreground": t.primaryForeground,
    "--center-secondary": t.secondary,
    "--center-secondary-soft": t.secondarySoft,
    "--center-accent": t.accent,
  } as CSSProperties;
};
