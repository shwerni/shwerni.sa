// deprecated path: every date helper now lives in utils/date.ts. these re-exports keep the old
// names and behaviour for files with uncommitted edits; delete this file once nothing imports it.

// utils
import { meetingSentence } from "@/utils/date";

export {
  meetingDateTime,
  DaysAheadFromToday,
  aboveAndLowerTime,
  timeToArabic,
  dateTimeToString,
  dateToArString,
  getWeekStartSaturday,
  // the old utils/time dateToString was the local-date format
  calendarDayToString as dateToString,
} from "@/utils/date";

// old argument order (time, date)
export const meetingLabel = (time: string, date: string) =>
  meetingSentence(date, time);
