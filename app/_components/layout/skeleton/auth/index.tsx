// components
import MLogo from "@/app/_components/layout/logo";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/app/_components/layout/skeleton/spinners";

// verify otp page
export default function AuthSkeleton() {
  return (
    <div className="cflex gap-10 min-w-screen min-h-screen sm:mx-3" dir="rtl">
      {/* main logo */}
      <MLogo />
      <Card className="cflex gap-10 w-11/12 max-w-[400px] mb-5 p-5" dir="ltr">
        <div className="cflex gap-2">
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-32 h-3" />
        </div>
        <Skeleton className="w-80 h-20" />
        <div className="rflex gap-5">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-10 h-10" />
        </div>
        <Skeleton className="w-24 h-10" />
        <Spinner style="stroke-zblue-200 w-10 h-10" title="جاري التحميل" />
      </Card>
    </div>
  );
}
