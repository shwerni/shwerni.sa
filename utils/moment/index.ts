// packages
moment.locale("en");
import "moment/locale/ar";
import moment from "moment-timezone";
import { addDays, isWithinInterval } from "date-fns";
import { format, addMinutes, parse } from "date-fns";

// lib
import { timeZone } from "@/lib/site/time";

// types
import { OwnerPreview } from "@/types/layout";

// prisma types
import { OrderType, Weekday } from "@/lib/generated/prisma/browser";

// is this time and date still
export const isStillTime = async (
  ctime: string | undefined,
  cdate: string | undefined,
  type: OrderType,
) => {
  // if no time and date
  if (!ctime || !cdate) return null;
  // check time
  try {
    // get time zone time and date
    const { time, date } = timeZone();
    // time now formatted
    const timeNow = moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss");
    // time to compare
    const compare =
      type === OrderType.SCHEDULED
        ? moment(`${cdate} ${ctime}:00`, "YYYY-MM-DD HH:mm:ss")
        : timeNow.add(10, "minutes");

    // is still time
    const isTime = timeNow.isSameOrBefore(compare);

    // return
    return isTime;
  } catch {
    return null;
  }
};

// increment date
export const incrementD = (date: string, count: number) => {
  const newDate = moment(date).add(count, "days").format("YYYY-MM-DD");
  // return
  return newDate;
};

// get seven days ahead
export const DaysAhead = (date: string | null, days: number) => {
  // check date
  if (!date) return null;

  // seven days array
  const daysAhead = Array.from({ length: days }, (_, i) => {
    const ndate = incrementD(date, i);
    return {
      day: dateToDbDay(ndate),
      date: ndate,
      label: moment(ndate).locale("ar").format("dddd"),
    };
  });

  // return sevenDays
  return daysAhead;
};

// meetings label
export const meetingLabel = (time: string, date: string) => {
  // day name
  const name = moment(date).locale("ar").format("dddd");
  // label
  const label = `الجلسة يوم ${name} الموافق ${date} الساعة ${timeToArabic(
    time,
  )}`;
  // return label
  return label;
};

// if not today then this is tomorrow
export const TodayOrTomorrow = async (mtime: string) => {
  try {
    // get time zone time and date
    const { time, date } = timeZone();
    // meeting formated date
    const meetingTime = moment(
      `${date} ${mtime}:00`,
      "YYYY-MM-DD HH:mm:ss",
    ).add(5, "minutes");
    // now time
    const nowTime = moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss");
    // is meeting time still not ended
    const exist = nowTime.isSameOrBefore(meetingTime);
    // meeting is today
    if (exist) return { date: date, label: meetingLabel(mtime, date) };
    // increment one day
    const ndate = incrementD(date, 1);
    // meeting is tomorrow
    return { date: ndate, label: meetingLabel(mtime, ndate) };
  } catch {
    return null;
  }
};

// get seven days ahead
export const DaysAheadFromToday = (days: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();

    // seven days array
    const daysAhead = Array.from({ length: days }, (_, i) => {
      const ndate = incrementD(date, i);
      return {
        day: dateToDbDay(ndate),
        date: ndate,
        label: moment(ndate).locale("ar").format("dddd"),
      };
    });

    // return sevenDays
    return daysAhead;
  } catch {
    return null;
  }
};

// get seven days ahead
export const DaysAheadEn = async (days: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();
    // seven days array
    const daysAhead = Array.from({ length: days }, (_, i) => {
      const ndate = incrementD(date, i);
      return {
        day: dateToDbDay(ndate),
        date: ndate,
        label: moment(ndate).format("dddd"),
      };
    });
    // return sevenDays
    return daysAhead;
  } catch {
    return null;
  }
};

// is this day equal target day or next
export const TargetDayDate = async (day: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();

    // today
    const today = moment(date);

    // target day
    const target =
      today.day() === day
        ? today.clone()
        : today.clone().day(today.day() < day ? day : day + 7);

    // return
    return {
      day: target.day(),
      date: target.format("YYYY-MM-DD"),
      label: target.locale("ar").format("dddd"),
    };
  } catch {
    return null;
  }
};

// above and lower the current time (offset)
export const aboveAndLowerTime = (time: string) => {
  // time
  const now = moment(time, "HH:mm");

  // minus
  const minus30 = now.clone().subtract(30, "minutes").format("HH:mm");

  // plus
  const plus30 = now.clone().add(30, "minutes").format("HH:mm");

  return [minus30, plus30];
};

/**
 * Adds minutes to a given time and date.
 * If the result exceeds the day, rolls over to the next day at 00:00.
 *
 * @param time - Time string in "HH:mm" format (e.g., "23:20")
 * @param date - Date string in "yyyy-MM-dd" format (e.g., "2025-08-01")
 * @param minutesToAdd - How many minutes to add (default: 25)
 * @returns Updated { time, date } object
 */
export const addMinutesToNow = (
  iDate?: string,
  iTime?: string,
  minutes = 25,
) => {
  // validate
  const tz = !iDate || !iTime ? timeZone() : null;

  // times
  const date = iDate ?? tz!.date;
  const time = iTime ?? tz!.time;

  // now
  const now = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());

  // new time after adding 25 min
  const clone = addMinutes(now, minutes);

  // Return updated time and original date
  return {
    nowTime: time,
    nowDate: date,
    time: format(clone, "HH:mm"),
    date: format(clone, "yyyy-MM-dd"),
  };
};

// filter avalible time for soon avalible owners
export const availableSoonFilter = (
  availability: Record<string, OwnerPreview[]>,
  nTime: string,
) => {
  // time now
  const time = moment(nTime, "HH:mm");

  // filter with time
  return Object.keys(availability)
    .filter((t) => moment(t, "HH:mm").isAfter(time))
    .sort((timeA, timeB) => moment(timeA, "HH:mm").diff(moment(timeB, "HH:mm")))
    .reduce(
      (fAvailability, time) => {
        fAvailability[time] = availability[time];
        return fAvailability;
      },
      {} as Record<string, OwnerPreview[]>,
    );
};

// meeting time is still or passed or now
export const meetingTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
  before?: number,
  after?: number,
) => {
  // time zone now
  const nowT = moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss");
  // time of meeting
  const meetingTime = moment(`${mDate} ${mTime}:00`, "YYYY-MM-DD HH:mm:ss");
  // before it with 5 min
  const beforeM = moment(meetingTime).add(before ?? -5, "minutes");
  // after it by 35 min
  const afterM = moment(meetingTime).add(after ?? 35, "minutes");
  // compare time differnece making sure 15 min before or 30 after
  const running = nowT.isSameOrAfter(beforeM) && nowT.isSameOrBefore(afterM);
  // meeting still there time ahead
  const still = nowT.isBefore(beforeM);
  // meeeting time is passed
  const passed = nowT.isAfter(afterM);
  // return true of running
  if (running) return true;
  // return false if passed
  if (passed) return false;
  // return null if still
  if (still) return null;
};

// is meeting passed
export const isMeetingPassed = (
  date: string,
  time: string,
  mDate: string,
  mTime: string,
): boolean => {
  return moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss").isAfter(
    moment(`${mDate} ${mTime}:00`, "YYYY-MM-DD HH:mm:ss"),
  );
};

// is meeting still
export const isMeetingStill = (
  date: string,
  time: string,
  mDate: string,
  mTime: string,
): boolean => {
  return moment(`${mDate} ${mTime}:00`, "YYYY-MM-DD HH:mm:ss").isSameOrAfter(
    moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss"),
  );
};

// 15 min before meeting to save attendance
export const attendanceTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
) => {
  // time zone now
  const nowT = moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss");
  // time of meeting
  const meetingTime = moment(`${mDate} ${mTime}:00`, "YYYY-MM-DD HH:mm:ss");
  // before it with 5 min
  const beforeM = moment(meetingTime).add(-15, "minutes");
  // after it by 35 min
  const afterM = moment(meetingTime).add(35, "minutes");
  // meeting still there time ahead
  const still = nowT.isAfter(beforeM);
  // meeting still there time ahead
  const notPassed = nowT.isBefore(afterM);
  // return null if still
  if (still && notPassed) return true;
  // else
  return false;
};

// custom intial times label
export const customITimes = (time: string) => {
  // time
  const momentTime = moment(time, "HH:mm");
  // 12 hour format
  const fTime = momentTime.format("hh:mm A");
  // replace AM/PM with Arabic labels
  return fTime.replace("AM", "صباحا").replace("PM", "مساءا");
};

// check date to days
export const checkDateToDays = (date: string, day: number) => {
  return moment(date).isoWeekday() === day;
};

// time to arabic label
export const timeToArabic = (time: string) => {
  return moment(time, "HH:mm").locale("ar").format("hh:mm A");
};

// format date to string english
export const dateToString = (date: Date) => {
  return moment(date).format("YYYY-MM-DD");
};

// format date to string english
export const dateToStringAr = (date: Date) => {
  return moment(date).format("DD-MM-YYYY");
};

// format date to string english
export const dateTimeToString = (date?: Date) => {
  if (!date) {
    // date
    const { iso } = timeZone();

    // formated
    return moment(iso).format("DD-MM-YYYY HH:mm");
  }
  return moment(date).format("DD-MM-YYYY HH:mm");
};

// format date to string english
export const dateToTime = (
  date: Date,
  is24Hour: boolean = true,
  locale: "en" | "ar" = "en",
): string => {
  // format
  const format = is24Hour ? "HH:mm" : "hh:mm A";
  // return
  return moment(date).locale(locale).format(format);
};

// format date to string english
export const dateToValidString = (date: Date) => {
  return moment(date).format("YYYY-MM-DD");
};

// format date to string arabic
export const dateToArString = (date: Date) => {
  return moment(date).locale("ar").format("DD-MM-YYYY");
};

export const dateToDayEn = (date: string) => {
  return moment(date).locale("en").format("dddd");
};

export const dateToDbDay = (date: string): Weekday => {
  const day = moment(date).locale("en").format("dddd").toUpperCase();
  return day as Weekday;
};
export const dateToWeekDay = (date: Date): Weekday => {
  const day = format(date, "EEEE").toUpperCase();
  return day as Weekday;
};

export const dateToDayAr = (date: string) => {
  return moment(date).locale("ar").format("dddd");
};

export const datetodayNumber = (date: string) => {
  return moment(date).day();
};

// free session
export const getWeekStartSaturday = (date: Date) => {
  const m = moment(date).tz("Asia/Riyadh").startOf("day");
  const day = m.isoWeekday();

  // If it's Saturday (6), keep today; else, subtract days
  return m.subtract(day >= 6 ? 0 : day + 1, "days").toDate();
};

export const isActiveWeekValid = (activeWeek: Date) => {
  // date
  const { iso } = timeZone();

  const today = moment(iso).tz("Asia/Riyadh").startOf("day").toDate();

  const weekStart = moment(activeWeek)
    .tz("Asia/Riyadh")
    .startOf("day")
    .toDate();
  const weekEnd = addDays(weekStart, 6);

  return isWithinInterval(today, { start: weekStart, end: weekEnd });
};

/**
 * Checks if a date is a specific day of the week AND the first such day in the month.
 * @param date - ISO date string YYYY-MM-DD
 * @param day - Weekday number ex:(1 = Monday, 7 = Sunday)
 */
export const isFirstWeekdayOfMonth = (date: string, day: number): boolean => {
  const mDate = moment(date);

  // 1. Check if it's the correct weekday
  if (mDate.isoWeekday() !== day) return false;

  // 2. Check if it's the first such weekday in the month
  const monthStart = mDate.clone().startOf("month");

  // Find first date in the month that matches the weekday
  const firstMatchingDay =
    monthStart.isoWeekday() <= day
      ? monthStart.clone().add(day - monthStart.isoWeekday(), "days")
      : monthStart.clone().add(7 - (monthStart.isoWeekday() - day), "days");

  return mDate.isSame(firstMatchingDay, "day");
};
