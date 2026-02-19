// db types
import { Consultant, Weekday } from "@prisma/client";

// dynamic days key
export type DayKeys =
  | "day0"
  | "day1"
  | "day2"
  | "day3"
  | "day4"
  | "day5"
  | "day6";

// languages
export type Lang = "en" | "ar";

// days
export interface Days {
  day: Weekday;
  date: string;
  label: string;
}

// onwer type for reservation
export interface Owner {
  owner: Consultant | null;
  tax: number | undefined;
  days: Days[] | null;
}

// date & time
export interface DateTime {
  date: string;
  time: string;
}

// short order data
export interface Sinvoice {
  oid: string;
  name: string;
  phone?: string;
  coname?: string;
  cid?: string;
  date?: string;
  rdate?: string;
  total?: string;
}

// grouped dues
export interface GroupedDues {
  cid: number;
  consultant: string;
  total: number;
  count: number;
  finalTotal: number;
  iban?: string;
  bankName?: string;
}
