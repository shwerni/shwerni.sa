// all date and time helpers live here (date-fns + date-fns-tz only). client-safe: no server imports.

// packages
import { ar, arSA } from "date-fns/locale";
import {
  format,
  addMinutes,
  parse,
  isAfter,
  isWithinInterval,
  isBefore,
  addDays,
  parseISO,
  getISODay,
  startOfDay,
  subDays,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// ─── riyadh clock ─────────────────────────────────────────────────────────────

// now in asia/riyadh: wall-clock time, date and a zoned Date (moved from lib/site/time.ts)
export const timeZone = () => {
  // time zone (riyadh)
  const zone = toZonedTime(new Date(), "Asia/Riyadh");

  // return time and date
  return {
    time: format(zone, "HH:mm"),
    date: format(zone, "yyyy-MM-dd"),
    iso: zone,
  };
};

// a meeting's "yyyy-MM-dd" + "HH:mm" in riyadh time as a real utc Date (inverse of timeZone())
export function meetingDateTime(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, "Asia/Riyadh");
}

// ─── date strings ─────────────────────────────────────────────────────────────

// a calendar day the user picked, as "yyyy-MM-dd" in the runtime's local zone (browser)
export const calendarDayToString = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

// the riyadh calendar day of an instant (slot times, server timestamps), whatever the runtime zone
export const riyadhDateString = (date: Date): string =>
  formatInTimeZone(date, "Asia/Riyadh", "yyyy-MM-dd");

// deprecated: utc date via toISOString. kept for files with uncommitted edits; new code uses
// calendarDayToString (picked days) or riyadhDateString (instants)
export const dateToString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// "dd-MM-yyyy HH:mm", of the given date or of riyadh now
export const dateTimeToString = (date?: Date) => {
  if (!date) {
    // date
    const { iso } = timeZone();
    return format(iso, "dd-MM-yyyy HH:mm");
  }
  return format(date, "dd-MM-yyyy HH:mm");
};

// "dd-MM-yyyy" with the arabic locale
export const dateToArString = (date: Date) => {
  return format(date, "dd-MM-yyyy", { locale: ar });
};

// ─── days ─────────────────────────────────────────────────────────────────────

// "yyyy-MM-dd" to the arabic day name, e.g. "2026-01-30" → "الجمعة"
export function getDayName(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE", { locale: arSA });
}

// prisma Weekday of a date (Weekday starts at SUNDAY, same order as getDay())
export function dateToWeekDay(date: Date): Weekday {
  return Object.keys(Weekday)[date.getDay()] as Weekday;
}

// n "yyyy-MM-dd" days starting at date, e.g. getDatesAhead(3, d) → [d, d+1, d+2]
export function getDatesAhead(
  daysAhead: number,
  date: Date = new Date(),
): string[] {
  if (daysAhead <= 0) return [];

  return Array.from({ length: daysAhead }, (_, i) =>
    format(addDays(date, i), "yyyy-MM-dd"),
  );
}

// the next n days from riyadh today, with prisma weekday and arabic day name
export const DaysAheadFromToday = (days: number) => {
  try {
    // get time zone time and date
    const { date } = timeZone();

    // days array
    return getDatesAhead(days, parseISO(date)).map((ndate) => ({
      day: dateToWeekDay(parseISO(ndate)),
      date: ndate,
      label: format(parseISO(ndate), "EEEE", { locale: ar }),
    }));
  } catch {
    return null;
  }
};

// the saturday that starts the riyadh week of a date (free sessions)
export const getWeekStartSaturday = (date: Date) => {
  // zoned date
  const zoned = startOfDay(toZonedTime(date, "Asia/Riyadh"));
  // iso day (1=mon ... 7=sun, 6=sat)
  const day = getISODay(zoned);
  // if saturday keep today else subtract to reach last saturday
  return day >= 6 ? zoned : subDays(zoned, day + 1);
};

// ─── minutes ──────────────────────────────────────────────────────────────────

// adds n minutes to a date (default riyadh now): { date: "yyyy-MM-dd", time: "HH:mm", iso }
export function addNMinutes(
  date: Date = timeZone().iso,
  minutes: number = 5,
): {
  date: string;
  time: string;
  iso: Date;
} {
  const next = addMinutes(date, minutes);

  return {
    date: format(next, "yyyy-MM-dd"),
    time: format(next, "HH:mm"),
    iso: next,
  };
}

// deprecated: same as addNMinutes(date, 25). kept for files with uncommitted edits
export function add25Minutes(date: Date = timeZone().iso) {
  return addNMinutes(date, 25);
}

// "HH:mm" 30 minutes before and after a time
export const aboveAndLowerTime = (time: string) => {
  // base time
  const base = parse(time, "HH:mm", new Date());
  // minus 30
  const minus30 = format(addMinutes(base, -30), "HH:mm");
  // plus 30
  const plus30 = format(addMinutes(base, 30), "HH:mm");

  return [minus30, plus30];
};

// ─── labels ───────────────────────────────────────────────────────────────────

// "HH:mm" to a 12-hour arabic label, e.g. "14:00" → "02:00 مساءً"
export const timeToArabic = (time: string) => {
  const parsed = parse(time, "HH:mm", new Date());
  return format(parsed, "hh:mm a")
    .replace("AM", "صباحاً")
    .replace("PM", "مساءً");
};

// same as timeToArabic ("صباحاً" / "مساءً"); old name kept for its callers
export const timeLabel = (time: string) => timeToArabic(time);

// "EEEE d MMMM yyyy" in arabic
export function dateLabel(date: Date) {
  return format(date, "EEEE d MMMM yyyy", {
    locale: ar,
  });
}

// weekday, day, month, year and 12-hour time, e.g. "السبت، 31 يناير 2026 · 11:30 مساءً"
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

// the meeting sentence with a 12-hour time: "الجلسة يوم … الموافق yyyy-MM-dd الساعة 02:00 مساءً"
export const meetingSentence = (date: string, time: string) => {
  // day name
  const name = format(parseISO(date), "EEEE", { locale: ar });
  // label
  return `الجلسة يوم ${name} الموافق ${date} الساعة ${timeToArabic(time)}`;
};

// same as meetingSentence (12-hour time); old name kept for its callers
export const meetingFullLabel = (date: string, time: string) =>
  meetingSentence(date, time);

// ─── meeting windows ──────────────────────────────────────────────────────────

// meeting status at a given riyadh date/time: true running, false passed, null upcoming
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

// true inside the attendance window (15 min before to 35 min after the meeting)
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
