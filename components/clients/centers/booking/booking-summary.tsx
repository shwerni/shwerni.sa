// utils
import { cn } from "@/utils/utils";

// props
interface Props {
  duration: string;
  dayLabel: string | null;
  timeLabel: string | null;
  totalWithTax: number;
  className?: string;
}

// the running choice and total (display only; Pay computes the charge on the server)
export function BookingSummary({
  duration,
  dayLabel,
  timeLabel,
  totalWithTax,
  className,
}: Props) {
  const choice = [`${duration} دقيقة`, dayLabel, timeLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">الإجمالي شامل الضريبة</p>
        <p className="truncate text-xs text-muted-foreground">{choice}</p>
      </div>
      <p className="shrink-0 text-lg font-bold">
        {totalWithTax}
        <span className="ms-1 text-sm font-medium text-muted-foreground">ر.س</span>
      </p>
    </div>
  );
}
