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
import { fromZonedTime, toZonedTime } from "date-fns-tz";

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

/**
 * combines a meeting's separate date + time strings, interpreted as
 * asia/riyadh local time, into a correct utc Date — mirrors the inverse
 * of the existing timeZone() utility (toZonedTime) for consistency
 */
export function meetingDateTime(date: string, time: string): Date {
  // assumes date: "YYYY-MM-DD", time: "HH:mm" (24h) — matches the format
  // timeZone() itself produces via format(zone, "HH:mm" / "yyyy-MM-dd")
  return fromZonedTime(`${date}T${time}:00`, "Asia/Riyadh");
}

// increment date
const incrementD = (date: string, count: number) => {
  return format(addDays(parseISO(date), count), "yyyy-MM-dd");
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

const meetingTime = (
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

// format date time to string
export const dateTimeToString = (date?: Date) => {
  if (!date) {
    // date
    const { iso } = timeZone();
    return format(iso, "dd-MM-yyyy HH:mm");
  }
  return format(date, "dd-MM-yyyy HH:mm");
};

// format date to string arabic
export const dateToArString = (date: Date) => {
  return format(date, "dd-MM-yyyy", { locale: ar });
};

const dateToDbDay = (date: string): Weekday => {
  const day = format(parseISO(date), "EEEE").toUpperCase();
  return day as Weekday;
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
