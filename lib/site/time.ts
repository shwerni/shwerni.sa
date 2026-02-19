// packages
import { toZonedTime, format } from "date-fns-tz";

// time zone modified
export const timeZone = () => {
  // time zone (riyadh)
  const zone = toZonedTime(new Date(), "Asia/Riyadh");

  // return time and dat
  return {
    time: format(zone, "HH:mm"),
    date: format(zone, "yyyy-MM-dd"),
    iso: zone,
  };
};
