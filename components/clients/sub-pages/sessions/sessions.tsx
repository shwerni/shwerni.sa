"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// componenets
import OrderTable from "../../shared/order-table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { Separator } from "@/components/ui/separator";
import PickDateTime from "../../shared/pick-date-time";

// utils
import { findParticipant } from "@/utils";
import { dateToString } from "@/utils/date";

// prisma types
import { Program } from "@/lib/generated/prisma/client";

// prisma data
import { selectSession } from "@/data/sessions";

// types
import { Reservation } from "@/types/admin";

// props
interface Props {
  session: number;
  order: Reservation;
  program: Program | null;
}

const SessionPick = ({ order, program, session }: Props) => {
  // router
  const router = useRouter();

  // states
  const [loading, setLoading] = React.useState<boolean>(false);
  const [times, setTimes] = React.useState<
    Record<string, string[]> | undefined
  >({});
  const [time, setTime] = React.useState<string | undefined>(undefined);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  // on submit
  async function onSubmit() {
    // laoding
    setLoading(true);

    // confirm
    try {
      // confirm
      if (time && date) {
        try {
          // create meeting
          const meeting = await selectSession(
            order.oid,
            time,
            dateToString(date),
            session,
          );

          // validate
          if (meeting) {
            // toast
            toast.success({ message: "تم تأكيد الاختيار بنجاح" });

            // redirect
            router.push(
              `/meetings/${meeting.mid}?session=${session}&participant=${findParticipant(meeting.participants)?.participant}`,
            );
            // return
            return true;
          }
        } catch {
          // return
          return null;
        }
      }
    } catch {
      // toast
      toast.error({ message: "حدث خطأ ما" });
    } finally {
      // laoding
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
      {/* order data */}
      <div className="flex flex-col items-center justify-center gap-1.5">
        <h3 className="text-theme font-semibold text-lg">
          اختيار موعد الجلسىة القادمة
        </h3>
        <p className="text-base font-medium">
          {program
            ? `برنامج ${program.title}`
            : `باكدج ${order.sessionCount} جلسات`}{" "}
          جلسة رقم <span className="text-theme">{session}</span>
        </p>
      </div>
      <OrderTable order={order} />
      {/* seperator */}
      <Separator className="w-10/12 max-w-xl mx-auto" />
      {/* pick form */}
      <PickDateTime
        cid={order.consultantId}
        daysAhead={7}
        unavailable={[]}
        selectedDate={date}
        setSelectedDate={setDate}
        selectedTime={time}
        setSelectedTime={setTime}
        availableTimes={times}
        setAvailableTimes={setTimes}
      />
      {/* submit */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={onSubmit}
        >
          تأكيد موعد الجلسة
        </Button>
      </div>
    </div>
  );
};

export default SessionPick;
