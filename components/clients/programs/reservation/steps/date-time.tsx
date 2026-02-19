// React & Next
import React from "react";

// components
import { Field } from "@/components/ui/field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { IconLabel } from "@/components/shared/icon-label";

// styles
import { getDefaultClassNames } from "react-day-picker";

// pacakges
import { addDays, isSameDay, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Controller, type UseFormReturn } from "react-hook-form";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { cn } from "@/lib/utils";
import { add25Minutes, dateToWeekDay } from "@/utils/date";

// schema
import { ProgramReservationFormType } from "@/schemas";

// prisma data
import { getConsultantAvailableTimes } from "@/data/consultant";

// utils
import { timeOptions } from "@/utils";
import { dateToString } from "@/utils/moment";

// icons
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";

// props
interface Props {
  form: UseFormReturn<ProgramReservationFormType>;
  onNext: () => void;
  onBack: () => void;
}

// phase meta data
const phaseMeta = {
  late: {
    label: "منتصف الليل",
    Icon: Moon,
    range: "12:00 ص - 4:30 م",
    style: "text-gray-500",
  },
  day: {
    label: "الصباح",
    Icon: Sunrise,
    range: "04:30 ص - 12:00 م",
    style: "text-yellow-500",
  },
  noon: {
    label: "الظهيرة",
    Icon: Sun,
    range: "12:00 م - 06:00 م",
    style: "text-amber-500",
  },
  night: {
    label: "المساء",
    Icon: Sunset,
    range: "06:00 م - 12:00 ص",
    style: "text-black",
  },
} as const;

export default function StepDateTime({ form, onNext, onBack }: Props) {
  // control
  const { control } = form;

  // cid & unavailable
  const { cid } = form.getValues();

  // acordin open
  const [open, setOpen] = React.useState<string | undefined>();

  // loading
  const [loading, setLoading] = React.useState<boolean>(false);

  // date
  const { iso: initial } = timeZone();

  // time
  const { date: iso, time } = React.useMemo(() => {
    return add25Minutes(initial);
  }, [initial]);

  // times
  const times = form.watch("times");

  // selected time
  const selectedTime = form.watch("time");

  // selected date
  const selectedDate = form.watch("date");

  // default calendar styles
  const classNames = React.useMemo(() => getDefaultClassNames(), []);

  // find time label and phase
  const timeByValue = React.useMemo(
    () =>
      Object.fromEntries(
        timeOptions.map((t) => [t.value, { label: t.label, phase: t.phase }]),
      ),
    [],
  );

  // open active grouped selected time accordion for ui/ux
  React.useEffect(() => {
    if (!selectedTime) return setOpen(undefined);

    setOpen(timeByValue[selectedTime]?.phase);
  }, [selectedTime, timeByValue]);

  async function fetchTimes(date: Date | undefined) {
    if (date) {
      // loading
      setLoading(true);

      // data
      const data = await getConsultantAvailableTimes(
        cid,
        dateToString(date),
        dateToWeekDay(date),
        isSameDay(date, iso) ? time : undefined,
      );

      // update times
      form.setValue("times", data, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      // loading
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* title */}
      <div className="inline-flex items-center gap-0.5">
        <CircleAlert className="w-5 text-gray-700" />
        <h3 className="text-xs text-gray-700 font-medium">
          قم باختيار التاريخ والوقت المناسب لك لاول جلسة من البرنامج
        </h3>
      </div>
      {/* date & time */}
      <div className="flex flex-col lg:grid grid-cols-3 gap-y-4">
        {/* calendar */}
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Field className="col-span-2">
              <Calendar
                className="col-span-2 w-full max-w-lg mx-auto data-[selected-single=true]:bg-white!"
                buttonVariant="ghost"
                classNames={{
                  disabled: cn(
                    classNames.disabled,
                    "text-gray-500 line-through",
                  ),
                  day_button: cn(
                    classNames.day_button,
                    "font-semibold data-[selected-single=true]:!bg-theme data-[selected-single=true]:!text-white rounded-full rounded-l-full! rounded-r-full!",
                  ),
                }}
                locale={ar}
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  field.onChange(date);
                  // @ts-expect-error - this is a hack to reset time when date changes
                  form.setValue("time", undefined);
                  // get this day times
                  fetchTimes(date);
                }}
                disabled={(date) =>
                  date < startOfDay(iso) || date > addDays(iso, 10)
                }
              />
            </Field>
          )}
        />

        {/* time slots */}
        <Controller
          name="time"
          control={control}
          render={({ field }) => {
            if (loading) return <TimeSkeleton />;

            if (!selectedDate)
              return (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 text-theme h-fit">
                  <CalendarIcon className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">اختر التاريخ أولاً</p>
                    <p className="text-xs text-gray-700 font-medium">
                      لتتمكن من رؤية المواعيد المتاحة، الرجاء اختيار تاريخ من
                      التقويم
                    </p>
                  </div>
                </div>
              );

            // no times
            if (!times || Object.values(times).every((t) => !t?.length))
              return (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50 text-red-700 h-fit">
                  <Clock className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">لا توجد مواعيد متاحة</p>
                    <p className="text-xs text-red-600/80 font-medium">
                      للأسف، لا توجد مواعيد متاحة لهذا اليوم. حاول اختيار يوم
                      آخر.
                    </p>
                  </div>
                </div>
              );

            return (
              <Accordion
                type="single"
                collapsible
                className="space-y-3"
                value={open}
                onValueChange={setOpen}
              >
                {Object.entries(times).map(([phase, phaseTimes]) => {
                  if (!phaseTimes || phaseTimes.length === 0) return;

                  const meta = phaseMeta[phase as keyof typeof phaseMeta];

                  return (
                    <AccordionItem
                      key={phase}
                      value={phase}
                      className="border-none transition-colors duration-300"
                    >
                      {/* phase header */}
                      <AccordionTrigger className="p-3 rounded-lg border hover:no-underline hover:bg-gray-100">
                        <div className="inline-flex justify-between items-center w-full">
                          <div className="inline-flex items-center gap-1.5">
                            <meta.Icon className={cn(meta.style, "w-5")} />
                            <h4 className="text-gray-700 text-sm font-medium">
                              {meta.label}
                            </h4>
                            {/* <span className="text-xs text-gray-600 font-medium">({phaseTimes.length})</span> */}
                          </div>
                          <span className="text-xs text-gray-500">
                            {meta.range}
                          </span>
                        </div>
                      </AccordionTrigger>

                      {/* times */}
                      <AccordionContent className="pt-2">
                        <div className="flex flex-col gap-1.5">
                          {phaseTimes.map((t) => {
                            const option = timeByValue[t];
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => field.onChange(t)}
                                className={cn(
                                  "w-full text-right text-gray-800 text-sm font-medium px-3 py-2 rounded-lg border transition-colors",
                                  field.value === t
                                    ? "bg-theme text-white border-theme hover:bg-theme/90"
                                    : "hover:bg-theme hover:text-white",
                                )}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            );
          }}
        />

        <div className="flex items-center justify-center gap-5">
          <Button variant="ghost" type="button" onClick={onBack} size="sm">
            <ChevronRight />
            الخطوة السابقة
          </Button>
          <Button variant="primary" type="button" onClick={onNext} size="sm">
            <IconLabel
              Icon={ChevronLeft}
              label="الخطوة التالية"
              className="text-sm"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-9 w-full rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}
