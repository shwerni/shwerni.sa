import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCoupons = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-3 gap-x-5">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton className="h-20" key={i} />
      ))}
    </div>
  </div>
);

export default SkeletonCoupons;
