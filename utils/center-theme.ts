// React & Next
import type { CSSProperties } from "react";

// constants
import {
  CenterPalette,
  CenterPaletteKey,
  centerPalettes,
  defaultCenterPalette,
  legacyPaletteKeys,
} from "@/constants/theme/center";

// keys a center may override (centers spec §13)
const PALETTE_KEYS = [
  "accent",
  "accentForeground",
  "accentText",
  "tint",
  "soft",
] as const;

// colors only: #rgb, #rrggbb or #rrggbbaa
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// the palette of a theme key (legacy keys mapped, unknown keys fall back to the default)
const paletteFor = (key?: string | null): CenterPalette => {
  const k = key ? (legacyPaletteKeys[key] ?? key) : defaultCenterPalette;
  return (
    centerPalettes[k as CenterPaletteKey] ?? centerPalettes[defaultCenterPalette]
  );
};

// a center's palette plus its overrides. unknown keys and non-color values are dropped,
// so stored theme data can never inject css
export const centerTheme = (key?: string | null, vars?: unknown): CenterPalette => {
  const preset = paletteFor(key);
  const overrides =
    vars && typeof vars === "object" ? (vars as Record<string, unknown>) : {};

  return Object.fromEntries(
    PALETTE_KEYS.map((k) => {
      const value = overrides[k];
      return [
        k,
        typeof value === "string" && HEX_COLOR.test(value) ? value : preset[k],
      ];
    }),
  ) as CenterPalette;
};

// the palette as css custom properties for the center wrapper
export const centerThemeStyle = (key?: string | null, vars?: unknown) => {
  const t = centerTheme(key, vars);
  return {
    "--center-accent": t.accent,
    "--center-accent-foreground": t.accentForeground,
    "--center-accent-text": t.accentText,
    "--center-tint": t.tint,
    "--center-soft": t.soft,
  } as CSSProperties;
};
