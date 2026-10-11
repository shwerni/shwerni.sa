"use client";
// React & Next
import { useState } from "react";

// components
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { togglePleading } from "@/actions/pleading";

// utils
import { pleadingErrors } from "@/utils/pleading";

// icons
import { Scale } from "lucide-react";

// the consultant's main form (LAW consultants only), under the listing visibility card and in
// the same look: receive pleading requests on the public مرافعة page. saved at once, like the
// visibility switch; togglePleading revalidates the public list
export function PleadingOptIn({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);

  // resync when the server value changes (e.g. after saving the profile)
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    setChecked(enabled);
  }

  const { execute, isPending } = useAction(togglePleading, {
    errors: { not_law: pleadingErrors.not_law },
    success: (data) =>
      data.enabled
        ? "تم تفعيل استقبال طلبات المرافعة"
        : "تم إيقاف استقبال طلبات المرافعة",
    onSuccess: (data) => setChecked(data.enabled),
    // the switch goes back to what the server has
    onError: () => setChecked((v) => !v),
  });

  return (
    <div
      dir="rtl"
      className="rounded-xl border border-zgrey-50 p-4 sm:p-5 mt-3"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-zblue-200" />
            <h5 className="text-sm">طلبات المرافعة</h5>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            يظهر إعلانك في صفحة المرافعة، ويرسل لك العملاء ملخص قضاياهم لترد
            عليهم وتحدد سعر الجلسة
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Label htmlFor="pleading-opt-in" className="text-sm font-normal">
            {checked ? "تستقبل الطلبات" : "لا تستقبل الطلبات"}
          </Label>
          <Switch
            id="pleading-opt-in"
            dir="ltr"
            checked={checked}
            disabled={isPending}
            onCheckedChange={(value) => {
              setChecked(value);
              execute({ enabled: value });
            }}
          />
        </div>
      </div>
    </div>
  );
}
