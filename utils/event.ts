import { Theme, ThemeKey, themes } from "@/constants/theme/event";
import { DiscountType } from "@/lib/generated/prisma/enums";

export const round = (n: number) => Math.round(n * 100) / 100;

export const applyRule = (
  value: number,
  rule: { type: DiscountType; discount: number; overrides?: unknown },
): number => {
  switch (rule.type) {
    case "PERCENT":
      return round(value * (1 - rule.discount / 100));
    case "FIXED":
      return round(Math.max(0, value - rule.discount));
    case "OVERRIDE":
      return round(rule.discount);
  }
};

export const getTheme = (key?: string | null, overrides?: unknown): Theme => {
  const theme = themes[key as ThemeKey] ?? themes.midnight;
  return {
    ...theme,
    ...((overrides as Partial<Theme>) ?? {}),
  } as Theme;
};
