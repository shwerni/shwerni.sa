// packages
moment.locale("en");
import "moment/locale/ar";
import moment from "moment-timezone";
import { ar, arSA } from "date-fns/locale";
import {
  format,
  addMinutes,
  parse,
  isAfter,
  isWithinInterval,
  isBefore,
} from "date-fns";
import { addDays, addHours, parseISO, setMinutes } from "date-fns";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// date to label
export function dateToLabel(date: number) {
  return moment(date).locale("ar").format("dddd");
}

/**
 * Converts yyyy-MM-dd to Arabic day name
 * @example "2026-01-30" → "الجمعة"
 */
export function getDayName(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE", { locale: arSA });
}

/**
 * Adds 25 minutes to the provided date (or now)
 * @returns { date: 'yyyy-MM-dd', time: 'HH:mm' }
 */
export function add25Minutes(date: Date = new Date()): {
  date: string;
  time: string;
  iso: Date;
} {
  const next = addMinutes(date, 25);

  return {
    date: format(next, "yyyy-MM-dd"),
    time: format(next, "HH:mm"),
    iso: next,
  };
}

/**
 * Rounds date to next 30-min or full hour
 * @returns { date: 'yyyy-MM-dd', time: 'HH:mm' }
 */
export function toNextHalfOrHour(date: Date = new Date()): {
  date: string;
  time: string;
  iso: Date;
} {
  const minutes = date.getMinutes();
  let next: Date;

  if (minutes === 0 || minutes === 30) {
    next = date;
  } else if (minutes < 30) {
    next = setMinutes(date, 30);
  } else {
    next = addHours(setMinutes(date, 0), 1);
  }

  return {
    iso: next,
    date: format(next, "yyyy-MM-dd"),
    time: format(next, "HH:mm"),
  };
}

/**
 * Returns yyyy-MM-dd for a date N days ahead
 */
export function getDateAhead(
  daysAhead: number,
  date: Date = new Date(),
): string {
  return format(addDays(date, daysAhead), "yyyy-MM-dd");
}

/**
 * Returns an array of yyyy-MM-dd dates for N days ahead
 * @example getDatesAhead(3) → [today, +1, +2]
 */
export function getDatesAhead(
  daysAhead: number,
  date: Date = new Date(),
): string[] {
  if (daysAhead <= 0) return [];

  return Array.from({ length: daysAhead }, (_, i) =>
    format(addDays(date, i), "yyyy-MM-dd"),
  );
}

/**
 * get weekday label as WeekDay type of pismae
 * @returns WeekDay
 */
export function dateToWeekDay(date: Date): Weekday {
  // format(date, "EEEE").toUpperCase();
  // moment(date).locale("en").format("dddd").toUpperCase();
  return Object.keys(Weekday)[date.getDay()] as Weekday;
}

/**
 * meeting label
 *
 * @param date Date object from form
 * @param time string like "07:00"
 */
export function meetingLabel(date: Date | string, time: string) {
  // merge date + time
  const dateTime = parse(time, "HH:mm", date);

  return `${format(dateTime, "EEEE، d MMMM yyyy", {
    locale: ar,
  })} · ${format(dateTime, "hh:mm a", {
    locale: ar,
  })
    .replace("ص", "صباحاً")
    .replace("م", "مساءً")}`;
}

/**
 * meeting label
 *
 * @param date string "yyyy-mm-dd"
 * @param time string like "07:00"
 */
export const meetingFullLabel = (date: string, time: string) => {
  // parse date safely
  const parsedDate = parse(time, "HH:mm", date);

  // day name in arabic
  const name = format(parsedDate, "EEEE", { locale: ar });

  // label
  const label = `الجلسة يوم ${name} الموافق ${date} الساعة ${time}`;

  // return label
  return label;
};

/**
 * @param date Date object from form
 * @param time string like "07:00"
 */
export function dateLabel(date: Date) {
  return format(date, "EEEE d MMMM yyyy", {
    locale: ar,
  });
}

/**
 * @param time string like "07:00" or "14:00"
 * @returns "07:00 صباحا" | "02:00 مساءا"
 */
export function timeLabel(time: string) {
  return format(parse(time, "HH:mm", new Date()), "hh:mm a")
    .replace("AM", "صباحا")
    .replace("PM", "مساءً");
}

/**
 * convert a JavaScript Date object into an ISO-like date string (YYYY-MM-DD)

 * @param date - JavaScript Date instance (must be valid)
 * @returns string formatted as "YYYY-MM-DD"
 *
 * @example
 * dateToString(new Date(2026, 1, 11)) // "2026-02-11"
 */
export const dateToString = (date: Date): string => {
  // return format(date, "yyyy-MM-dd");
  return date.toISOString().split("T")[0];
};

/**
 * Determine meeting status
 * @param time current time (HH:mm)
 * @param date current date (YYYY-MM-DD)
 * @param mTime meeting time (HH:mm)
 * @param mDate meeting date (YYYY-MM-DD)
 * @param before minutes before meeting start (default 5)
 * @param after minutes after meeting start (default 35)
 * @returns true if running, false if passed, null if still upcoming
 */
export const meetingTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
  before = 5,
  after = 35,
): boolean | null => {
  // parse current time and meeting time
  const now = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  const meeting = parse(`${mDate} ${mTime}`, "yyyy-MM-dd HH:mm", new Date());

  // meeting interval
  const start = addMinutes(meeting, -before);
  const end = addMinutes(meeting, after);

  // check status
  if (isWithinInterval(now, { start, end })) return true;
  if (isAfter(now, end)) return false;
  return null;
};

/**
 * Check if a meeting is within attendance window
 * (15 min before to 35 min after)
 * @param time current time (HH:mm)
 * @param date current date (YYYY-MM-DD)
 * @param mTime meeting time (HH:mm)
 * @param mDate meeting date (YYYY-MM-DD)
 * @returns true if within attendance window, false otherwise
 */
export const attendanceTime = (
  time: string,
  date: string,
  mTime: string,
  mDate: string,
): boolean => {
  // parse current time and meeting time
  const now = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  const meeting = parse(`${mDate} ${mTime}`, "yyyy-MM-dd HH:mm", new Date());

  // attendance window
  const start = addMinutes(meeting, -15); // 15 min before
  const end = addMinutes(meeting, 35); // 35 min after

  // return true if now is within window
  return isAfter(now, start) && isBefore(now, end);
};
