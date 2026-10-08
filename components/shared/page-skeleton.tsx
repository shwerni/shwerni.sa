// components
import { Skeleton } from "@/components/ui/skeleton";

// a light placeholder below the site header while a detail page streams in (instead of the
// full-screen blurred spinner): a title, two lines and a row of cards
export default function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-5/6 max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
