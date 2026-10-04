// components
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/clients/centers/skeletons";

// the centers directory while it loads
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardGridSkeleton />
    </div>
  );
}
