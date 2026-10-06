// React & Next
import type { ReactNode } from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import { IconSquare } from "@/components/clients/centers/icon-square";

// utils
import { cn } from "@/utils/utils";

// types
import type { LucideIcon } from "lucide-react";

// shared building blocks of the center dashboard (same visual language as the center pages)

// a page title with an optional one-line description
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

// a slim card: one hairline border
export function Panel({
  title,
  icon,
  children,
  className,
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center gap-2.5">
          {icon && <IconSquare icon={icon} size="sm" />}
          <h2 className="font-semibold">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

// a stat tile: value, label and an icon square
export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="min-w-0">
        <p className="truncate text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <IconSquare icon={icon} />
    </div>
  );
}

// an empty list
export function EmptyState({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-10 text-center">
      <IconSquare icon={icon} tone="neutral" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// a riyal amount
export const sar = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;

// page skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-18.5 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
