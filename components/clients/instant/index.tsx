// React & Next
import React, { Suspense } from "react";

// lib
import { userServer } from "@/lib/auth/server";

// data
import { getFinanceConfig } from "@/data/admin/settings/finance";

// components
import InstantReservationForm from "./reservation/form";
import { Skeleton } from "@/components/ui/skeleton";

// the title is static (prerendered); the form needs the session and the finance settings, so it
// streams in its own suspense boundary
const Instant: React.FC = () => {
  return (
    <div className="max-w-3xl space-y-5 mx-auto my-10" dir="rtl">
      {/* instant title */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex flex-col items-center gap-y-3">
          <h3 className="text-theme-700 text-xl sm:text-2xl font-semibold">
            استشارة مباشرة وسريعة
          </h3>
          <div className="w-10/12 h-1 max-w-40 bg-gray-200 rouneded" />
        </div>
        <p className="text-sm text-gray-700 text-center">
          اختر من المستشارين المتاحين الآن واحجز جلستك فورًا دون الحاجة لتحديد
          موعد مسبق، لتتمكن من الحصول على الدعم والاستشارة في اللحظة التي
          تحتاجها.
        </p>
      </div>
      {/* instant content */}
      <Suspense fallback={<Skeleton className="h-96 w-11/12 max-w-3xl mx-auto" />}>
        <InstantForm />
      </Suspense>
    </div>
  );
};

export default Instant;

// the reservation form with the visitor's session and the finance settings
async function InstantForm() {
  // user
  const user = await userServer();

  // get finance
  const finance = await getFinanceConfig();

  return <InstantReservationForm user={user} finance={finance} />;
}
