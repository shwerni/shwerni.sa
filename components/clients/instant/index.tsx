// React & Next
import React from "react";

// lib
import { userServer } from "@/lib/auth/server";

// data
import { getFinanceConfig } from "@/data/admin/settings/finance";

// components
import InstantReservationForm from "./reservation/form";

const Instant: React.FC = async () => {
  // user
  const user = await userServer();

  // get finance
  const finance = await getFinanceConfig();

  return (
    <div className="max-w-3xl space-y-5 mx-auto my-10" dir="rtl">
      {/* instant title */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex flex-col items-center gap-y-3">
          <h3 className="text-[#094577] text-xl sm:text-2xl font-semibold">
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
      <InstantReservationForm user={user} finance={finance} />
    </div>
  );
};

export default Instant;
