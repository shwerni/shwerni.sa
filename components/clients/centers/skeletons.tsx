// components
import { Skeleton } from "@/components/ui/skeleton";

// a row of consultant / center cards
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// the inline quick-info chips in the hero
export function QuickInfoSkeleton() {
  return (
    <div className="mt-1 flex gap-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// center home: compact hero, then the consultant grid
export function CenterHomeSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-4">
      <div className="flex flex-col gap-5 rounded-3xl bg-muted/40 px-5 py-6 sm:flex-row sm:items-end sm:px-8 sm:py-8">
        <Skeleton className="size-20 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <QuickInfoSkeleton />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <CardGridSkeleton />
      </div>
    </div>
  );
}

// booking panel
export function BookingPanelSkeleton() {
  return (
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-xl" />
    </div>
  );
}

// consultant page: profile + booking panel
export function ConsultantPageSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="size-22 rounded-2xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <BookingPanelSkeleton />
    </div>
  );
}
