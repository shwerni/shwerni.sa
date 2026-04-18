"use client";
// React & Next
import React from "react";

// packages
import { isSameDay } from "date-fns";

// components
import Header from "@/components/clients/header/header";
import Reels from "@/components/clients/discover/reels";
import TimeStep from "@/components/clients/discover/time";
import DateStep from "@/components/clients/discover/date";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { add25Minutes, getDatesAhead } from "@/utils/date";

// prisma data
import { getAvailableTimesForDate } from "@/data/reels";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

type Step = "date" | "time" | "reel";

export default function Page() {
  // time zone & dates
  const { iso: initial } = timeZone();
  const { date: iso, time: nowTime } = React.useMemo(
    () => add25Minutes(initial),
    [initial],
  );

  // days // 7 is better later
  const days = getDatesAhead(6, initial);

  // states
  const [step, setStep] = React.useState<Step>("date");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [selectedGender, setSelectedGender] = React.useState<Gender | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] =
    React.useState<Categories | null>(null);
  const [flatTimes, setFlatTimes] = React.useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = React.useState(false);

  // handle date select
  async function handleDateSelect(dateStr: string) {
    const date = new Date(dateStr);
    setSelectedDate(date);
    setSelectedTime(null);
    setFlatTimes([]);
    setLoadingTimes(true);
    setStep("time");

    try {
      const minTime = isSameDay(date, iso) ? nowTime : undefined;
      const times = await getAvailableTimesForDate(dateStr, minTime);
      setFlatTimes(times);
    } finally {
      setLoadingTimes(false);
    }
  }

  // handle time select
  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep("reel");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="relative flex-1 overflow-hidden">
        {/* step 1: Date */}
        <StepView active={step === "date"}>
          <Header />
          <DateStep
            days={days}
            iso={iso}
            onSelect={handleDateSelect}
            gender={selectedGender}
            setGender={setSelectedGender}
            category={selectedCategory}
            setCategory={setSelectedCategory}
          />
        </StepView>

        {/* step 2: Time */}
        <StepView active={step === "time"}>
          <Header />
          {selectedDate && (
            <TimeStep
              selectedDate={selectedDate}
              times={flatTimes}
              loading={loadingTimes}
              onBack={() => setStep("date")}
              onSelect={handleTimeSelect}
            />
          )}
        </StepView>

        {/* step 3: Reel */}
        <StepView active={step === "reel"}>
          {selectedDate && selectedTime && (
            <Reels
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedGender={selectedGender}
              selectedCategory={selectedCategory}
              onBack={() => setStep("time")}
            />
          )}
        </StepView>
      </div>
    </div>
  );
}

function StepView({
  active,

  children,
}: {
  active: boolean;

  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col transition-all duration-300"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(40px)",
        pointerEvents: active ? "auto" : "none",
        visibility: active ? "visible" : "hidden",
        zIndex: active ? 10 : 0,
      }}
    >
      {children}
    </div>
  );
}
