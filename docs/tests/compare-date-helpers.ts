// checks the date helpers in utils/date.ts on edge inputs. run as the server (utc) and as a
// browser in riyadh:
//   TZ=UTC npx tsx docs/tests/compare-date-helpers.ts
//   TZ=Asia/Riyadh npx tsx docs/tests/compare-date-helpers.ts

// packages
import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// utils
import * as d from "@/utils/date";
import * as legacyTime from "@/utils/time";

// lib
import * as legacySiteTime from "@/lib/site/time";

// fixed "now" for helpers that read the clock (timeZone(), new Date())
const RealDate = Date;
function freezeNow(iso: string) {
  const fixed = new RealDate(iso).getTime();
  // @ts-expect-error test-only clock override
  globalThis.Date = class extends RealDate {
    constructor(...args: unknown[]) {
      // @ts-expect-error spread into Date
      super(...(args.length ? args : [fixed]));
    }
    static now() {
      return fixed;
    }
  };
}
const unfreeze = () => (globalThis.Date = RealDate);

// real instants: riyadh wall time -> utc (riyadh = utc+3)
const INSTANTS: [string, string, string][] = [
  ["riyadh 2026-01-31 23:30 (month end)", "2026-01-31T20:30:00Z", "2026-01-31"],
  ["riyadh 2026-02-01 00:00 (midnight)", "2026-01-31T21:00:00Z", "2026-02-01"],
  ["riyadh 2026-02-01 01:30", "2026-01-31T22:30:00Z", "2026-02-01"],
  ["riyadh 2026-02-01 02:59", "2026-01-31T23:59:00Z", "2026-02-01"],
  ["riyadh 2026-12-31 23:59 (year end)", "2026-12-31T20:59:00Z", "2026-12-31"],
  ["riyadh 2027-01-01 00:30", "2026-12-31T21:30:00Z", "2027-01-01"],
];
const DAYS = ["2026-01-31", "2026-02-01", "2026-12-31", "2027-01-01"];

let wrong = 0, diffs = 0;
const mark = (value: string, expected: string) => {
  if (value === expected) return value;
  wrong++;
  return `${value} WRONG`;
};
function same(label: string, a: [string, unknown], b: [string, unknown]) {
  const ok = JSON.stringify(a[1]) === JSON.stringify(b[1]);
  if (!ok) diffs++;
  console.log(`${ok ? "same" : "DIFF"} | ${label} | ${a[0]}=${JSON.stringify(a[1])} | ${b[0]}=${JSON.stringify(b[1])}`);
}

console.log(`runtime offset=${new Date().getTimezoneOffset()} min\n`);

// 1. instants (slot times, created_at): expected = the riyadh day
console.log("== instants: expected the riyadh day ==");
console.log("case | riyadhDateString | calendarDayToString | legacy dateToString (utc)");
for (const [name, iso, expected] of INSTANTS) {
  const t = new Date(iso);
  console.log(`${name} | ${mark(d.riyadhDateString(t), expected)} | ${d.calendarDayToString(t)} | ${d.dateToString(t)}`);
}

// 2. picked calendar days, built the three ways the ui builds them: expected = the picked day
console.log("\n== picked calendar days: expected the picked day ==");
console.log("case | calendarDayToString | riyadhDateString | legacy dateToString (utc)");
for (const day of DAYS) {
  const [y, m, dd] = day.split("-").map(Number);
  const builds: [string, Date][] = [
    [`new Date("${day}") (utc midnight, pickers)`, new Date(day)],
    [`Date.UTC ${day} (programs)`, new Date(Date.UTC(y, m - 1, dd))],
    [`parseISO ${day} (local midnight)`, parseISO(day)],
  ];
  for (const [label, value] of builds)
    console.log(`${label} | ${mark(d.calendarDayToString(value), day)} | ${d.riyadhDateString(value)} | ${d.dateToString(value)}`);
}

// 3. zoned "now" (timeZone().iso): its date string is timeZone().date
console.log("\n== zoned now: timeZone().date ==");
for (const [name, iso, expected] of INSTANTS) {
  freezeNow(iso);
  const tz = d.timeZone();
  console.log(`${name} | timeZone().date=${mark(tz.date, expected)} | riyadhDateString(zoned)=${d.riyadhDateString(tz.iso)} (not for zoned dates)`);
  same(`${name} old path`, ["lib/site/time", legacySiteTime.timeZone().date], ["utils/date", tz.date]);
  same(`${name} days ahead`, ["DaysAheadFromToday", (d.DaysAheadFromToday(3) ?? []).map((x) => x.date)], ["getDatesAhead(tz)", d.getDatesAhead(3, parseISO(tz.date))]);
  unfreeze();
}

// 4. old names must equal the canonical functions
console.log("\n== old names ==");
for (const t of ["00:00", "02:59", "11:59", "12:00", "23:59"]) {
  same(t, ["timeLabel", d.timeLabel(t)], ["timeToArabic", d.timeToArabic(t)]);
  for (const day of DAYS) {
    same(`${day} ${t}`, ["meetingFullLabel", d.meetingFullLabel(day, t)], ["meetingSentence", d.meetingSentence(day, t)]);
    same(`${day} ${t}`, ["utils/time meetingLabel(t, d)", legacyTime.meetingLabel(t, day)], ["meetingSentence", d.meetingSentence(day, t)]);
  }
}
for (const [name, iso] of INSTANTS) {
  const zoned = toZonedTime(new Date(iso), "Asia/Riyadh");
  const a = d.add25Minutes(zoned), b = d.addNMinutes(zoned, 25);
  same(name, ["add25Minutes", [a.date, a.time]], ["addNMinutes(25)", [b.date, b.time]]);
  same(name, ["utils/time dateToString", legacyTime.dateToString(new Date(iso))], ["calendarDayToString", d.calendarDayToString(new Date(iso))]);
}

console.log(`\n${wrong} wrong result(s) from the recommended function, ${diffs} difference(s) between old and canonical names`);
