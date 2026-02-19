"use server";
// utils
import {
  addMinutesToNow,
  dateToDbDay,
  DaysAhead,
  incrementD,
  isMeetingStill,
} from "@/utils/moment";

// lib
import { timeZone } from "@/lib/site/time";

// prisma data
import { getAvailableOwnersByTime, getOwnerByCid } from "@/data/consultant";
import { getTaxCommission } from "@/data/admin/settings/finance";

// load owner page faster
export const LoadOwnerByCid = async (cid: number) => {
  try {
    const [consultant, taxCommission] = await Promise.all([
      getOwnerByCid(cid),
      getTaxCommission(),
    ]);

    // time
    const { date } = timeZone();

    // 4 days ahead
    const days = DaysAhead(date, 4);

    // return
    return {
      owner: consultant,
      tax: taxCommission?.tax ?? undefined,
      days: days ?? [],
    };
  } catch {
    // return
    return undefined;
  }
};

export const LoadAvailableSoonByTime = async (selected: string) => {
  try {
    // timezone now
    const { time, date, nowTime, nowDate } = addMinutesToNow();

    // it time not exists
    if (!time || !date) return undefined;

    // increment on time to check past due
    const still = isMeetingStill(date, time, nowDate, selected);

    // new date
    const newDay = still ? nowDate : incrementD(date, 1);

    // owners
    const owners = await getAvailableOwnersByTime(
      dateToDbDay(newDay),
      newDay,
      selected,
    );

    // return
    return { owners, date: date };
  } catch {
    // return
    return undefined;
  }
};

// load avaliable soon owner
export const LoadFreeSession = async () => {
  try {
    // // timezone now
    // const { time, date } = timeZone();
    // // it time not exists
    // if (time || !date) return undefined;
    // // increment on time to check past due
    // const { time: nTime, date: nDate } = pastDueTime(time, date);
    // // owners
    // const owners = await getOwnersGroupedByTimes(
    //   `day${datetodayNumber(nDate)}` as DayKeys,
    //   nTime,
    //   nDate
    // );
    // // return
    // return { owners, date: nDate };
  } catch {
    // return
    return undefined;
  }
};
