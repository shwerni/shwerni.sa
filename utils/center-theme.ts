// React & Next
import type { CSSProperties } from "react";

// constants
import { Theme, ThemeKey, themes } from "@/constants/theme/event";

// keys a center theme may override (the event preset shape, centers spec §13)
const THEME_KEYS = ["from", "via", "to", "accent", "glow"] as const;

// colors only: #rgb, #rrggbb or #rrggbbaa
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// a center's preset plus its overrides. unknown keys and non-color values are dropped,
// so stored theme data can never inject css
export const centerTheme = (key?: string | null, vars?: unknown): Theme => {
  const preset: Theme = themes[key as ThemeKey] ?? themes.midnight;
  const overrides =
    vars && typeof vars === "object" ? (vars as Record<string, unknown>) : {};

  return Object.fromEntries(
    THEME_KEYS.map((k) => {
      const value = overrides[k];
      return [
        k,
        typeof value === "string" && HEX_COLOR.test(value) ? value : preset[k],
      ];
    }),
  ) as Theme;
};

// the theme as css custom properties for the center wrapper
export const centerThemeStyle = (key?: string | null, vars?: unknown) => {
  const t = centerTheme(key, vars);
  return {
    "--center-from": t.from,
    "--center-via": t.via,
    "--center-to": t.to,
    "--center-accent": t.accent,
    "--center-glow": t.glow,
  } as CSSProperties;
};
