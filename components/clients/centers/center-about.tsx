// icons
import { Info } from "lucide-react";

// props
interface Props {
  description: string | null;
  policy: string | null;
}

// about the center (the full description, shown once) and its policy as a quiet note
export function CenterAbout({ description, policy }: Props) {
  return (
    <section id="about" className="scroll-mt-24 space-y-3">
      <h2 className="text-lg font-semibold">عن المركز</h2>
      <p className="whitespace-pre-line leading-8 text-muted-foreground">
        {description || "لا يوجد وصف بعد."}
      </p>
      {policy && (
        <p className="flex items-start gap-2 pt-1 text-sm leading-6 text-muted-foreground">
          <Info
            className="mt-1 size-4 shrink-0 text-(--center-secondary)"
            strokeWidth={1.75}
          />
          <span>
            <span className="font-medium text-foreground">سياسة الحضور والإلغاء: </span>
            {policy}
          </span>
        </p>
      )}
    </section>
  );
}
