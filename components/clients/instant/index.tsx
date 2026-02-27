"use client";
// React & Next
import React from "react";

// components
import ReservationInstant from "@/components/clients/instant/reservation";

// auth types
import { User } from "next-auth";

// hooks
import { useOnlineConsultants } from "@/hooks/useOnlineConsultants";

// props
interface Props {
  user?: User;
}

const Instant: React.FC<Props> = ({ user }) => {
  // check online instant reservation state
 // const { consultants, loading } = useOnlineConsultants();

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
      <ReservationInstant
        consultants={[]}
        loading={true}
        user={user}
      />
    </div>
  );
};

export default Instant;
