import { Skeleton } from "@/components/ui/skeleton";

const GlobalSkeleton = () => (
  <div className="space-y-8">
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="flex w-full max-w-lg flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-col gap-4 border-l-2 pl-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-4 border-l-2 pl-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

export default GlobalSkeleton;
