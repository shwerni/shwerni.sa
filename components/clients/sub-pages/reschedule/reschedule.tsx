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

// icons
import { Ban, CircleAlert } from "lucide-react";

// utils
import { findParticipant } from "@/utils";
import { dateToString } from "@/utils/date";

// prisma data
import { rescheduleMeeting } from "@/data/reschedule";
import { Meeting, Participant } from "@/lib/generated/prisma/client";

// prisma enums
import { RescheduleReason } from "@/lib/generated/prisma/enums";

// types
import { Reservation } from "@/types/admin";

// reason options — label map
const REASON_OPTIONS: { value: RescheduleReason; label: string }[] = [
  { value: RescheduleReason.CLIENT_NO_SHOW, label: "العميل لم يحضر" },
  { value: RescheduleReason.CONSULTANT_NO_SHOW, label: "المستشار لم يحضر" },
  { value: RescheduleReason.OTHER, label: "سبب آخر" },
];

// props
interface Props {
  meeting: Meeting & { participants: Participant[] };
  order: Reservation;
}

const ReschedulePick = ({ meeting, order }: Props) => {
  // router
  const router = useRouter();

  // states
  const [loading, setLoading] = React.useState<boolean>(false);
  const [times, setTimes] = React.useState<
    Record<string, string[]> | undefined
  >({});
  const [time, setTime] = React.useState<string | undefined>(undefined);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [reason, setReason] = React.useState<RescheduleReason | undefined>(
    undefined,
  );

  // derive whether meeting time is still ahead (not yet started)
  const isMeetingAhead = React.useMemo(() => {
    const [hours, minutes] = meeting.time.split(":").map(Number);
    const meetingStart = new Date(meeting.date);
    meetingStart.setHours(hours, minutes, 0, 0);
    return new Date() < meetingStart;
  }, [meeting.date, meeting.time]);

  // participant — used for redirect url
  const participant = findParticipant(meeting.participants)?.participant;

  // on submit
  async function onSubmit() {
    // loading
    setLoading(true);
    // confirm
    try {
      // confirm
      if (time && date && reason) {
        try {
          // reschedule meeting
          await rescheduleMeeting(meeting.mid, dateToString(date), time, reason);
          // toast
          toast.success({ message: "تم تأكيد إعادة الجدولة بنجاح" });
          // redirect
          router.push(`/meetings/${meeting.mid}?participant=${participant}`);
          // return
          return true;
        } catch {
          // return
          return null;
        }
      }
    } catch {
      // toast
      toast.error({ message: "حدث خطأ ما" });
    } finally {
      // loading
      setLoading(false);
    }
  }

  if (meeting.done) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
        {/* order data */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <h3 className="text-theme font-semibold text-lg">
            إعادة جدولة الجلسة
          </h3>
          <p className="text-sm font-medium">
            الموعد الحالي:{" "}
            <span className="text-theme font-semibold">
              {meeting.date} | {meeting.time}
            </span>
          </p>
        </div>
        <OrderTable order={order} />
        {/* seperator */}
        <Separator className="w-10/12 max-w-xl mx-auto" />
        {/* done message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <Ban className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            انتهت هذه الجلسة
          </h3>
          <p className="text-xs text-muted-foreground">
            لا يمكن إعادة جدولة جلسة منتهية
          </p>
        </div>
      </div>
    );
  }

  if (isMeetingAhead) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
        {/* order data */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <h3 className="text-theme font-semibold text-lg">
            إعادة جدولة الجلسة
          </h3>
          <p className="text-base font-medium">
            الموعد الحالي:{" "}
            <span className="text-theme">
              {meeting.date} — {meeting.time}
            </span>
          </p>
        </div>
        <OrderTable order={order} />
        {/* seperator */}
        <Separator className="w-10/12 max-w-xl mx-auto" />
        {/* ahead message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <CircleAlert className="text-amber-500 w-8 h-8" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            موعد الجلسة لم يحن بعد
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            الجلسة مجدولة في {meeting.date} — {meeting.time}
          </p>
          {/* redirect to meeting page */}
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              router.push(`/meetings/${meeting.mid}?participant=${participant}`)
            }
          >
            الذهاب إلى صفحة الجلسة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
      {/* order data */}
      <div className="flex flex-col items-center justify-center gap-1.5">
        <h3 className="text-theme font-semibold text-lg">إعادة جدولة الجلسة</h3>
        <p className="text-base font-medium">
          الموعد الحالي:{" "}
          <span className="text-theme">
            {meeting.date} — {meeting.time}
          </span>
        </p>
      </div>
      <OrderTable order={order} />
      {/* seperator */}
      <Separator className="w-10/12 max-w-xl mx-auto" />
      {/* reason select */}
      <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
        <label
          htmlFor="reschedule-reason"
          className="text-sm font-medium text-foreground"
        >
          سبب إعادة الجدولة
        </label>
        <select
          id="reschedule-reason"
          value={reason ?? ""}
          onChange={(e) => setReason(e.target.value as RescheduleReason)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          dir="rtl"
        >
          {/* placeholder */}
          <option value="" disabled>
            اختر السبب
          </option>
          {/* options */}
          {REASON_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
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
          disabled={!reason || !date || !time}
          onClick={onSubmit}
        >
          تأكيد إعادة الجدولة
        </Button>
      </div>
    </div>
  );
};
export default ReschedulePick;