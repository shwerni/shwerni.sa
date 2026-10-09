"use client";
// React & Next
import { useState } from "react";

// components
import { Switch } from "@/components/ui/switch";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { togglePleading } from "@/actions/pleading";

// utils
import { pleadingErrors } from "@/utils/pleading";

// icons
import { Scale } from "lucide-react";

// profile settings (LAW consultants only): receive pleading requests on the public مرافعة page
export function PleadingOptIn({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);

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
    <div className="flex flex-col gap-5" dir="rtl">
      <h3 className="flex flex-row items-center gap-1 text-zblue-200">
        <Scale />
        طلبات المرافعة
      </h3>
      <div className="flex items-center justify-between gap-4 w-2/3">
        <label htmlFor="pleading-opt-in" className="space-y-1 cursor-pointer">
          <span className="block text-sm font-medium">
            استقبال طلبات المرافعة
          </span>
          <span className="block text-sm text-muted-foreground">
            يظهر ملفك في صفحة المرافعة، ويرسل لك العملاء ملخص قضاياهم لتحدد سعر
            الجلسة
          </span>
        </label>
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
  );
}
