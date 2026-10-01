"use client";

// React & Next
import { useState } from "react";

// components
import { Switch } from "@/components/ui/switch";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { setVisibilityAction } from "@/actions/consultant";

// the server page reads the current value and passes it in; this component only handles the toggle
export function VisibilitySwitch({
  initialPublished,
}: {
  initialPublished: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);

  const { execute, isPending } = useAction(setVisibilityAction, {
    errors: { not_found: "لم يتم العثور على ملفك كمستشار" },
    success: (data) =>
      data.published ? "ملفك ظاهر الآن للعملاء" : "تم إخفاء ملفك عن العملاء",
    // roll back the optimistic toggle
    onError: () => setPublished((value) => !value),
  });

  function toggle(next: boolean) {
    setPublished(next);
    execute({ published: next });
  }

  return (
    <Switch checked={published} disabled={isPending} onCheckedChange={toggle} />
  );
}
