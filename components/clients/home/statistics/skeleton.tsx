// components
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCounter = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="flex flex-col items-center justify-center gap-3" key={index}>
          <Skeleton className="bg-[#117ED8]/70 w-15 h-4" />
          <Skeleton className="bg-[#117ED8]/70 w-12 h-4" />
        </div>
      ))}
    </>
  );
};

export default SkeletonCounter;
