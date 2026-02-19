// componenets
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// props
interface Props {
  count?: number;
  className?: string;
  CardClassName?: string;
}

const CardSkeleton = ({
  className = "flex items-center gap-5",
  count = 1,
  CardClassName = "w-full max-w-sm",
}: Props) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(CardClassName, "flex flex-col gap-3")}>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
