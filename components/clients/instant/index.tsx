"use client";
// React & Next
import React from "react";

// package
import useSWR from "swr";

// components
import ReservationInstant from "@/components/clients/instant/reservation";

// auth types
import { User } from "next-auth";

// prisma types
import { Instant as InstantType } from "@/lib/generated/prisma/client";

// prisma data
import { getOwnerByCids } from "@/data/consultant";

// props
interface Props {
  user: User | undefined;
  time: string;
  date: string;
}

const Instant: React.FC<Props> = ({ user, time, date }) => {
  // fetch
  const getConsultants = async () => {
    const response = await fetch("/api/instant");
    console.log("response");
    console.log(response);
    
    const data: InstantType[] = await response.json();
    console.log("data");
    console.log(data);

    if (!data.length) return null;

    const owners = await getOwnerByCids(data.map((i) => i.consultantId));
    console.log("owners");
    console.log(owners);

    if (!owners || !owners.length) return null;

    return owners.map((owner) => ({
      owner,
      instant: data.find((inst) => inst.consultantId === owner.cid),
    }));
  };

  // get avalible consultants
  const { data } = useSWR("/api/instant", () => getConsultants(), {
    refreshInterval: 15000,
    errorRetryCount: 1,
    errorRetryInterval: 10000,
  });

  React.useEffect(() => {
    console.log("data");
    console.log(data);
  }, [data]);

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
        data={data ?? []}
        date={date}
        time={time}
        user={user}
      />
    </div>
  );
};

export default Instant;
