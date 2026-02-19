import { Skeleton } from "@/components/ui/skeleton";

const ProgramSkeleton = () => (
  <div className="flex flex-col md:grid grid-cols-6 justify-items-center gap-5 mx-3 my-6">
    {/* right side */}
    <div className="col-span-4 flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-10 w-3/4" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex w-full max-w-md flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex items-center gap-3" key={i}>
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
    {/* left side */}
    <div className="flex flex-col gap-10 w-full">
      {Array.from({ length: 7 }).map((_, i) => (
        <div className="flex items-center gap-3" key={i}>
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  </div>
);

export default ProgramSkeleton;
