// compares duplicate date/time helpers on edge inputs before merging them.
// run twice, as the server (utc) and as a browser in riyadh:
//   TZ=UTC npx tsx docs/tests/compare-date-helpers.ts
//   TZ=Asia/Riyadh npx tsx docs/tests/compare-date-helpers.ts

// packages
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// utils
import * as dateUtils from "@/utils/date";
import * as timeUtils from "@/utils/time";
import { timeOptions } from "@/utils";

// lib
import { timeZone } from "@/lib/site/time";

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

// real instants, named by their asia/riyadh wall time (riyadh = utc+3)
const INSTANTS: Record<string, string> = {
  "riyadh 2026-01-31 23:30 (month end, late night)": "2026-01-31T20:30:00Z",
  "riyadh 2026-02-01 00:00 (midnight)": "2026-01-31T21:00:00Z",
  "riyadh 2026-02-01 01:30 (after midnight, utc still jan 31)": "2026-01-31T22:30:00Z",
  "riyadh 2026-02-01 02:59": "2026-01-31T23:59:00Z",
  "riyadh 2026-12-31 23:59 (year end)": "2026-12-31T20:59:00Z",
  "riyadh 2027-01-01 00:30 (utc still 2026)": "2026-12-31T21:30:00Z",
};
// calendar days as the ui builds them
const DAYS = ["2026-01-31", "2026-02-01", "2026-12-31", "2027-01-01"];
const TIMES = ["00:00", "00:30", "02:59", "11:59", "12:00", "12:30", "23:30", "23:59"];

let diffs = 0;
function compare(label: string, a: [string, unknown], b: [string, unknown]) {
  const same = JSON.stringify(a[1]) === JSON.stringify(b[1]);
  if (!same) diffs++;
  console.log(`${same ? "same" : "DIFF"} | ${label} | ${a[0]}=${JSON.stringify(a[1])} | ${b[0]}=${JSON.stringify(b[1])}`);
}

console.log(`runtime TZ=${process.env.TZ ?? "(unset)"} offset=${new Date().getTimezoneOffset()} min\n`);

// 1. dateToString: utils/date (toISOString) vs utils/time (format)
console.log("== dateToString ==");
for (const [name, iso] of Object.entries(INSTANTS)) {
  const real = new Date(iso);
  compare(`real instant ${name}`, ["date", dateUtils.dateToString(real)], ["time", timeUtils.dateToString(real)]);
  const zoned = toZonedTime(real, "Asia/Riyadh");
  compare(`zoned (timeZone().iso style) ${name}`, ["date", dateUtils.dateToString(zoned)], ["time", timeUtils.dateToString(zoned)]);
}
for (const d of DAYS) {
  const [y, m, dd] = d.split("-").map(Number);
  compare(`new Date(y,m,d) ${d}`, ["date", dateUtils.dateToString(new Date(y, m - 1, dd))], ["time", timeUtils.dateToString(new Date(y, m - 1, dd))]);
  compare(`parseISO ${d}`, ["date", dateUtils.dateToString(parseISO(d))], ["time", timeUtils.dateToString(parseISO(d))]);
  compare(`new Date("${d}")`, ["date", dateUtils.dateToString(new Date(d))], ["time", timeUtils.dateToString(new Date(d))]);
}

// 2. days ahead: getDatesAhead(n, timeZone().iso) vs DaysAheadFromToday(n)
console.log("\n== days ahead (now frozen) ==");
for (const [name, iso] of Object.entries(INSTANTS)) {
  freezeNow(iso);
  const tz = timeZone();
  compare(
    `${name} (getDatesAhead with default now)`,
    ["getDatesAhead()", dateUtils.getDatesAhead(3)],
    ["DaysAheadFromToday", (timeUtils.DaysAheadFromToday(3) ?? []).map((x) => x.date)],
  );
  compare(
    `${name} (getDatesAhead from timeZone().iso)`,
    ["getDatesAhead(iso)", dateUtils.getDatesAhead(3, tz.iso)],
    ["DaysAheadFromToday", (timeUtils.DaysAheadFromToday(3) ?? []).map((x) => x.date)],
  );
  unfreeze();
}

// 3. time labels: timeLabel (utils/date) vs timeToArabic (utils/time) vs timeOptions lookup (4 components)
console.log("\n== time labels ==");
for (const t of TIMES) {
  const lookup = timeOptions.find((o) => o.value === t)?.label ?? t;
  compare(`${t}`, ["timeLabel", dateUtils.timeLabel(t)], ["timeToArabic", timeUtils.timeToArabic(t)]);
  compare(`${t}`, ["timeToArabic", timeUtils.timeToArabic(t)], ["timeOptions", lookup]);
}

// 4. meeting labels: meetingFullLabel (utils/date) vs meetingLabel (utils/time, args swapped)
console.log("\n== meeting labels ==");
for (const d of DAYS)
  for (const t of ["00:00", "23:59"])
    compare(`${d} ${t}`, ["date.meetingFullLabel", dateUtils.meetingFullLabel(d, t)], ["time.meetingLabel", timeUtils.meetingLabel(t, d)]);

// 5. weekday: dateToWeekDay (utils/date, getDay + enum order) vs utils/time's internal format("EEEE") rule
console.log("\n== weekday ==");
for (const d of DAYS) {
  compare(`parseISO ${d}`, ["dateToWeekDay", dateUtils.dateToWeekDay(parseISO(d))], ["EEEE upper", format(parseISO(d), "EEEE").toUpperCase()]);
  compare(`new Date("${d}")`, ["dateToWeekDay", dateUtils.dateToWeekDay(new Date(d))], ["EEEE upper", format(new Date(d), "EEEE").toUpperCase()]);
}

// 6. add25Minutes vs addNMinutes(date, 25)
console.log("\n== add minutes ==");
for (const [name, iso] of Object.entries(INSTANTS)) {
  const zoned = toZonedTime(new Date(iso), "Asia/Riyadh");
  const a = dateUtils.add25Minutes(zoned), b = dateUtils.addNMinutes(zoned, 25);
  compare(name, ["add25Minutes", [a.date, a.time]], ["addNMinutes(25)", [b.date, b.time]]);
}

console.log(`\n${diffs} difference(s)`);
