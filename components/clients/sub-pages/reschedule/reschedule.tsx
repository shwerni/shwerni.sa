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
import { Ban, CircleAlert, CircleCheck, CheckCircle2 } from "lucide-react";

// utils
import { findParticipant } from "@/utils";
import { dateToString } from "@/utils/date";

// prisma data
import { rescheduleMeeting, meetingDone } from "@/data/reschedule";
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
  const [markingDone, setMarkingDone] = React.useState<boolean>(false);
  const [markedDone, setMarkedDone] = React.useState<boolean>(false);
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

  // mark meeting as done manually
  async function onMarkDone() {
    setMarkingDone(true);
    try {
      await meetingDone(meeting.mid);
      setMarkedDone(true);
      // redirect after 1 second
      setTimeout(() => router.push("/"), 1000);
    } catch {
      toast.error({ message: "حدث خطأ أثناء تحديث الجلسة" });
    } finally {
      setMarkingDone(false);
    }
  }

  // on submit
  async function onSubmit() {
    setLoading(true);
    try {
      if (time && date && reason) {
        try {
          await rescheduleMeeting(
            meeting.mid,
            dateToString(date),
            time,
            reason,
          );
          toast.success({ message: "تم تأكيد إعادة الجدولة بنجاح" });
          router.push(`/meetings/${meeting.mid}?participant=${participant}`);
          return true;
        } catch {
          return null;
        }
      }
    } catch {
      toast.error({ message: "حدث خطأ ما" });
    } finally {
      setLoading(false);
    }
  }

  // thank you screen — shown after marking done
  if (markedDone) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="text-green-500 w-9 h-9" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            تم تحديث الجلسة
          </h3>
          <p className="text-sm text-muted-foreground">
            تم تعليم الجلسة كمنتهية بنجاح
          </p>
        </div>
      </div>
    );
  }

  if (meeting.done) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
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
        <Separator className="w-10/12 max-w-xl mx-auto" />
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
        <Separator className="w-10/12 max-w-xl mx-auto" />
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
      <Separator className="w-10/12 max-w-xl mx-auto" />

      {/* mark as done banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-sm mx-auto rounded-lg border border-green-100 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CircleCheck className="text-green-600 w-4 h-4 shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            هل تمت الجلسة بالفعل؟
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={markingDone}
          onClick={onMarkDone}
          className="border-green-300 text-green-700 hover:bg-green-100 shrink-0"
        >
          تعليم كمنتهية
        </Button>
      </div>

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
          <option value="" disabled>
            اختر السبب
          </option>
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
