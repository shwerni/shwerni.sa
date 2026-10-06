"use client";
// React & Next
import React from "react";

// components
import { Panel } from "@/components/center-dashboard/ui";
import { Switch } from "@/components/ui/switch";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { saveCenterTheme } from "@/actions/center/settings";

// constants
import {
  CenterThemeColors,
  CenterThemeKey,
  centerThemes,
  defaultCenterTheme,
  legacyThemeKeys,
} from "@/constants/theme/center";

// utils
import { cn } from "@/utils/utils";
import { meetsAA } from "@/utils/contrast";
import { centerTheme, centerThemeStyle } from "@/utils/center-theme";

// icons
import { CalendarCheck, Check, Loader2, Palette, Sparkles, TriangleAlert } from "lucide-react";

const COLOR_FIELDS: { key: keyof CenterThemeColors; label: string }[] = [
  { key: "primary", label: "اللون الأساسي (الأزرار)" },
  { key: "primaryForeground", label: "النص على اللون الأساسي" },
  { key: "secondary", label: "اللون الثانوي (الأيقونات والشارات)" },
  { key: "secondarySoft", label: "خلفية العناصر الثانوية" },
  { key: "accent", label: "الخلفية الخفيفة" },
];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// props
interface Props {
  themeKey: string;
  themeVars: unknown;
}

// pick one of the curated themes, optionally override its colors (hex only); live preview.
// the server checks AA contrast again before saving
export function ThemeForm({ themeKey, themeVars }: Props) {
  const initialKey = (
    (legacyThemeKeys[themeKey] ?? themeKey) in centerThemes
      ? (legacyThemeKeys[themeKey] ?? themeKey)
      : defaultCenterTheme
  ) as CenterThemeKey;
  const initialVars =
    themeVars && typeof themeVars === "object" ? (themeVars as Record<string, string>) : {};

  const [key, setKey] = React.useState<CenterThemeKey>(initialKey);
  const [custom, setCustom] = React.useState(Object.keys(initialVars).length > 0);
  const [vars, setVars] = React.useState<Partial<Record<keyof CenterThemeColors, string>>>(
    initialVars,
  );

  // only valid hex overrides count (the server drops anything else too)
  const overrides = custom
    ? Object.fromEntries(Object.entries(vars).filter(([, v]) => v && HEX.test(v)))
    : {};
  const colors = centerTheme(key, overrides);
  const primaryOk = meetsAA(colors.primary, colors.primaryForeground);
  const secondaryOk =
    meetsAA(colors.secondary, colors.secondarySoft) && meetsAA(colors.secondary, "#ffffff");

  const { execute, isPending } = useAction(saveCenterTheme, {
    success: "تم حفظ المظهر",
    errors: {
      contrast_primary: "لون النص على اللون الأساسي غير واضح بما يكفي، اختر ألواناً أكثر تبايناً",
      contrast_secondary: "اللون الثانوي غير واضح على خلفيته، اختر لوناً أغمق",
    },
  });

  function save() {
    execute({
      themeKey: key,
      themeVars: Object.keys(overrides).length ? overrides : null,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <Panel title="الثيم" icon={Palette}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(centerThemes) as CenterThemeKey[]).map((k) => {
              const t = centerThemes[k];
              const active = k === key;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKey(k)}
                  aria-pressed={active}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border p-3 text-start transition",
                    active
                      ? "border-foreground/60 ring-2 ring-foreground/10"
                      : "border-border/70 hover:border-foreground/30",
                  )}
                >
                  <div className="flex gap-1">
                    {[t.primary, t.secondary, t.accent].map((c) => (
                      <span
                        key={c}
                        className="size-6 rounded-full ring-1 ring-black/5"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                  {active && (
                    <Check className="absolute end-2 top-2 size-4" strokeWidth={2} />
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="تخصيص الألوان (اختياري)" icon={Sparkles}>
          <label className="mb-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              تعديل ألوان الثيم المختار. الألوان بصيغة HEX فقط.
            </span>
            <Switch checked={custom} onCheckedChange={setCustom} />
          </label>
          {custom && (
            <div className="grid gap-3 sm:grid-cols-2">
              {COLOR_FIELDS.map((f) => {
                const value = vars[f.key] ?? "";
                const invalid = value !== "" && !HEX.test(value);
                return (
                  <label key={f.key} className="flex flex-col gap-1.5 text-sm">
                    <span>{f.label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={HEX.test(value) && value.length === 7 ? value : centerThemes[key][f.key]}
                        onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="size-9 shrink-0 cursor-pointer rounded-lg border border-border/70 bg-transparent"
                        aria-label={f.label}
                      />
                      <input
                        value={value}
                        placeholder={centerThemes[key][f.key]}
                        onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value.trim() }))}
                        dir="ltr"
                        className={cn(
                          "h-9 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm",
                          invalid ? "border-destructive" : "border-border",
                        )}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* live preview */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
        <div style={centerThemeStyle(key, overrides)} className="rounded-2xl border border-border/70 bg-background p-4">
          <p className="mb-3 text-xs text-muted-foreground">معاينة</p>
          <div className="rounded-2xl bg-(--center-accent) p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-(--center-primary) font-bold text-(--center-primary-foreground)">
                م
              </span>
              <div>
                <p className="font-semibold">اسم المركز</p>
                <span className="mt-1 inline-block rounded-full bg-(--center-secondary-soft) px-2.5 py-0.5 text-xs font-medium text-(--center-secondary)">
                  للجميع
                </span>
              </div>
            </div>
            <span className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-(--center-primary) px-4 text-sm font-semibold text-(--center-primary-foreground)">
              <CalendarCheck className="size-4" strokeWidth={1.75} />
              احجز موعد
            </span>
          </div>
        </div>

        {(!primaryOk || !secondaryOk) && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            {!primaryOk
              ? "التباين بين اللون الأساسي ونصه أقل من المطلوب للقراءة."
              : "التباين بين اللون الثانوي وخلفيته أقل من المطلوب للقراءة."}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--center-primary) font-semibold text-(--center-primary-foreground) transition hover:opacity-90 disabled:opacity-60"
          style={centerThemeStyle(key, overrides)}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          حفظ المظهر
        </button>
      </div>
    </div>
  );
}
