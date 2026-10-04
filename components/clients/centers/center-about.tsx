// components
import { IconSquare } from "@/components/clients/centers/icon-square";

// icons
import { Info } from "lucide-react";

// props
interface Props {
  description: string | null;
  policy: string | null;
}

// about the center, with its arrival / cancellation policy as a quiet note
export function CenterAbout({ description, policy }: Props) {
  return (
    <section id="about" className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-semibold">عن المركز</h2>
      <p className="max-w-3xl whitespace-pre-line leading-8 text-muted-foreground">
        {description || "لا يوجد وصف بعد."}
      </p>
      {policy && (
        <div className="flex max-w-3xl items-start gap-3 rounded-2xl bg-muted/60 p-4">
          <IconSquare icon={Info} size="sm" />
          <div>
            <p className="text-sm font-medium">سياسة الحضور والإلغاء</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {policy}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
