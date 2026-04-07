// packages
import {
  addDays,
  isWithinInterval,
  format,
  addMinutes,
  parse,
  parseISO,
  isAfter,
  isBefore,
  isSameDay,
  getDay,
  getISODay,
  startOfMonth,
  startOfDay,
  subDays,
} from "date-fns";
import { ar } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

// lib
import { timeZone } from "@/lib/site/time";

// types
import { OwnerPreview } from "@/types/layout";

// prisma types
import { OrderType, Weekday } from "@/lib/generated/prisma/browser";

// ─── helpers ─────────────────────────────────────────────────────────────────

// parse "yyyy-MM-dd HH:mm" into a Date
const parseDateTime = (date: string, time: string) =>
  parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());

// ─── functions ───────────────────────────────────────────────────────────────

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
    const timeNow = parseDateTime(date, time);
    // time to compare
    const compare =
      type === OrderType.SCHEDULED
        ? parseDateTime(cdate, ctime)
        : addMinutes(timeNow, 10);
    // is still time
    const isTime = !isAfter(timeNow, compare);
    // return
    return isTime;
  } catch {
    return null;
  }
};

// increment date
export const incrementD = (date: string, count: number) => {
  return format(addDays(parseISO(date), count), "yyyy-MM-dd");
};

// get N days ahead
export const DaysAhead = (date: string | null, days: number) => {
  // check date
  if (!date) return null;

  // days array
  const daysAhead = Array.from({ length: days }, (_, i) => {
    const ndate = incrementD(date, i);
    return {
      day: dateToDbDay(ndate),
      date: ndate,
      label: format(parseISO(ndate), "EEEE", { locale: ar }),
    };
  });

  // return daysAhead
  return daysAhead;
};

// meetings label
export const meetingLabel = (time: string, date: string) => {
  // day name
  const name = format(parseISO(date), "EEEE", { locale: ar });
  // label
  const label = `الجلسة يوم ${name} الموافق ${date} الساعة ${timeToArabic(time)}`;
  // return label
  return label;
};

// if not today then this is tomorrow
export const TodayOrTomorrow = async (mtime: string) => {
  try {
    // get time zone time and date
    const { time, date } = timeZone();
    // meeting time + 5 min buffer
    const meetingTime = addMinutes(parseDateTime(date, mtime), 5);
    // now time
    const nowTime = parseDateTime(date, time);
    // is meeting time still not ended
    const exist = !isAfter(nowTime, meetingTime);
    // meeting is today
    if (exist) return { date, label: meetingLabel(mtime, date) };
    // increment one day
    const ndate = incrementD(date, 1);
    // meeting is tomorrow
    return { date: ndate, label: meetingLabel(mtime, ndate) };
  } catch {
    return null;
  }
};

// get N days ahead from today
export const DaysAheadFromToday = (days: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();

    // days array
    const daysAhead = Array.from({ length: days }, (_, i) => {
      const ndate = incrementD(date, i);
      return {
        day: dateToDbDay(ndate),
        date: ndate,
        label: format(parseISO(ndate), "EEEE", { locale: ar }),
      };
    });

    // return daysAhead
    return daysAhead;
  } catch {
    return null;
  }
};

// get N days ahead (english labels)
export const DaysAheadEn = async (days: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();
    // days array
    const daysAhead = Array.from({ length: days }, (_, i) => {
      const ndate = incrementD(date, i);
      return {
        day: dateToDbDay(ndate),
        date: ndate,
        label: format(parseISO(ndate), "EEEE"),
      };
    });
    // return daysAhead
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
    const today = parseISO(date);
    const todayDay = getISODay(today); // 1=Mon ... 7=Sun

    // target — same day or next occurrence
    const daysUntil =
      todayDay === day
        ? 0
        : day > todayDay
          ? day - todayDay
          : 7 - (todayDay - day);
    const target = addDays(today, daysUntil);

    // return
    return {
      day: getISODay(target),
      date: format(target, "yyyy-MM-dd"),
      label: format(target, "EEEE", { locale: ar }),
    };
  } catch {
    return null;
  }
};

// above and lower the current time (offset)
export const aboveAndLowerTime = (time: string) => {
  // base time
  const base = parse(time, "HH:mm", new Date());
  // minus 30
  const minus30 = format(addMinutes(base, -30), "HH:mm");
  // plus 30
  const plus30 = format(addMinutes(base, 30), "HH:mm");

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
  const now = parseDateTime(date, time);
  // new time after adding minutes
  const clone = addMinutes(now, minutes);
  // return updated time and original date
  return {
    nowTime: time,
    nowDate: date,
    time: format(clone, "HH:mm"),
    date: format(clone, "yyyy-MM-dd"),
  };
};

// filter available time for soon available owners
export const availableSoonFilter = (
  availability: Record<string, OwnerPreview[]>,
  nTime: string,
) => {
  // time now
  const time = parse(nTime, "HH:mm", new Date());

  // filter with time
  return Object.keys(availability)
    .filter((t) => isAfter(parse(t, "HH:mm", new Date()), time))
    .sort((timeA, timeB) => {
      const a = parse(timeA, "HH:mm", new Date()).getTime();
      const b = parse(timeB, "HH:mm", new Date()).getTime();
      return a - b;
    })
    .reduce(
      (fAvailability, time) => {
        fAvailability[time] = availability[time];
        return fAvailability;
      },
      {} as Record<string, OwnerPreview[]>,
    );
};

export const meetingTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
  before?: number,
  after?: number,
) => {
  // time zone now
  const nowT = parseDateTime(date, time);
  // time of meeting
  const meeting = parseDateTime(mDate, mTime);
  // before it with 5 min
  const beforeM = addMinutes(meeting, -(before ?? 5));
  // after it by 35 min
  const afterM = addMinutes(meeting, after ?? 35);
  // compare time difference making sure 15 min before or 30 after
  const running = !isBefore(nowT, beforeM) && !isAfter(nowT, afterM);
  // meeting still there time ahead
  const still = isBefore(nowT, beforeM);
  // meeting time is passed
  const passed = isAfter(nowT, afterM);
  // return true if running
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
  return isAfter(parseDateTime(date, time), parseDateTime(mDate, mTime));
};

// is meeting still
export const isMeetingStill = (
  date: string,
  time: string,
  mDate: string,
  mTime: string,
): boolean => {
  return !isBefore(parseDateTime(mDate, mTime), parseDateTime(date, time));
};

// 15 min before meeting to save attendance
export const attendanceTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
) => {
  // time zone now
  const nowT = parseDateTime(date, time);
  // time of meeting
  const meeting = parseDateTime(mDate, mTime);
  // before it with 15 min
  const beforeM = addMinutes(meeting, -15);
  // after it by 35 min
  const afterM = addMinutes(meeting, 35);
  // meeting still there time ahead
  const still = isAfter(nowT, beforeM);
  // meeting still there time ahead
  const notPassed = isBefore(nowT, afterM);
  // return null if still
  if (still && notPassed) return true;
  // else
  return false;
};

// custom initial times label
export const customITimes = (time: string) => {
  // parse time
  const parsed = parse(time, "HH:mm", new Date());
  // 12 hour format
  const fTime = format(parsed, "hh:mm a");
  // replace AM/PM with Arabic labels
  return fTime.replace("AM", "صباحا").replace("PM", "مساءا");
};

// check date to days
export const checkDateToDays = (date: string, day: number) => {
  return getISODay(parseISO(date)) === day;
};

// time to arabic label
export const timeToArabic = (time: string) => {
  const parsed = parse(time, "HH:mm", new Date());
  return format(parsed, "hh:mm a")
    .replace("AM", "صباحاً")
    .replace("PM", "مساءً");
};

// format date to string english
export const dateToString = (date: Date) => {
  if (!date || isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

// format date to string arabic
export const dateToStringAr = (date: Date) => {
  if (!date || isNaN(date.getTime())) return "";
  return format(date, "dd-MM-yyyy");
};

// format date time to string
export const dateTimeToString = (date?: Date) => {
  if (!date) {
    // date
    const { iso } = timeZone();
    return format(iso, "dd-MM-yyyy HH:mm");
  }
  return format(date, "dd-MM-yyyy HH:mm");
};

// format date to time string
export const dateToTime = (
  date: Date,
  is24Hour: boolean = true,
  locale: "en" | "ar" = "en",
): string => {
  // format
  const fmt = is24Hour ? "HH:mm" : "hh:mm a";
  // return
  return format(date, fmt, { locale: locale === "ar" ? ar : undefined });
};

// format date to valid string
export const dateToValidString = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

// format date to string arabic
export const dateToArString = (date: Date) => {
  return format(date, "dd-MM-yyyy", { locale: ar });
};

export const dateToDayEn = (date: string) => {
  return format(parseISO(date), "EEEE");
};

export const dateToDbDay = (date: string): Weekday => {
  const day = format(parseISO(date), "EEEE").toUpperCase();
  return day as Weekday;
};

export const dateToWeekDay = (date: Date): Weekday => {
  const day = format(date, "EEEE").toUpperCase();
  return day as Weekday;
};

export const dateToDayAr = (date: string) => {
  return format(parseISO(date), "EEEE", { locale: ar });
};

export const datetodayNumber = (date: string) => {
  return getDay(parseISO(date));
};

// free session
export const getWeekStartSaturday = (date: Date) => {
  // zoned date
  const zoned = startOfDay(toZonedTime(date, "Asia/Riyadh"));
  // iso day (1=Mon ... 7=Sun, 6=Sat)
  const day = getISODay(zoned);
  // if saturday keep today else subtract to reach last saturday
  return day >= 6 ? zoned : subDays(zoned, day + 1);
};

export const isActiveWeekValid = (activeWeek: Date) => {
  // date
  const { iso } = timeZone();

  const today = startOfDay(toZonedTime(iso, "Asia/Riyadh"));
  const weekStart = startOfDay(toZonedTime(activeWeek, "Asia/Riyadh"));
  const weekEnd = addDays(weekStart, 6);

  return isWithinInterval(today, { start: weekStart, end: weekEnd });
};

/**
 * Checks if a date is a specific day of the week AND the first such day in the month.
 * @param date - ISO date string YYYY-MM-DD
 * @param day - Weekday number ex:(1 = Monday, 7 = Sunday)
 */
export const isFirstWeekdayOfMonth = (date: string, day: number): boolean => {
  const parsed = parseISO(date);

  // 1. Check if it's the correct weekday
  if (getISODay(parsed) !== day) return false;

  // 2. Check if it's the first such weekday in the month
  const monthStart = startOfMonth(parsed);
  const monthStartDay = getISODay(monthStart);

  // find first date in the month that matches the weekday
  const daysUntil =
    monthStartDay <= day ? day - monthStartDay : 7 - (monthStartDay - day);
  const firstMatchingDay = addDays(monthStart, daysUntil);

  return isSameDay(parsed, firstMatchingDay);
};
