// types
import { Lang } from "@/types/types";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  PaymentMethod,
  PaymentState,
  ReviewState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// types
import { CurrencyValue, Times } from "@/types/admin";

// constatnts
import {
  users,
  currencies,
  categories,
  paymentStatuses,
  paymentMethods,
  coStatus,
  approvalStatus,
  reviewStatus,
} from "@/constants/admin";
import { itimes } from "@/constants";
import { timeZone } from "@/lib/site/time";
import { User } from "next-auth";
import { dateTimeToString } from "./moment";
import { mainRoute } from "@/constants/links";
import { zencryption } from "./admin/encryption";

// check langauge
export const isEnglish = (lang?: Lang): boolean => lang === "en";

// validate phone number
export const phoneNumber = (number: string) => {
  return number.replace(/\D/g, "");
};

// payment statuses
export const findPayment = (status: PaymentState) => {
  return paymentStatuses.find((s) => s.state === status);
};

// payment method
export const findPaymentMethod = (method: PaymentMethod) => {
  return paymentMethods.find((s) => s.mehtod === method);
};

// category
export const findCategory = (id: Categories) => {
  return categories.find((s) => s.id === id);
};

// user
export const findUser = (role: UserRole) => {
  return users.find((s) => s.role === role);
};

// category
export const findReview = (state: ReviewState) => {
  return reviewStatus.find((s) => s.state === state);
};

// currency
export const findCurrency = (value: CurrencyValue) => {
  return currencies.find((t) => t.value === value);
};

// consultant profile status state hidden, hold , published controled by admin
export const findConsultantState = (status: ConsultantState) => {
  return coStatus.find((s) => s.state === status);
};

// consultant profile status state hidden, hold , published controled by admin
export const findApprovalState = (status: ApprovalState) => {
  return approvalStatus.find((s) => s.state === status);
};

// time options map
export const timeOptions: Times[] = Object.entries(itimes).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
    phase: meta.phase,
  }),
);

// initial time
export const findTime = (value: string) => {
  const item = itimes[value];
  return item ? { ...item, value } : undefined;
};

/**
 * Filters times and removes anything before minTime
 * @example minTime = "15:30" → removes 15:00, 14:30, etc
 */
export function filterTimesAfter(times: Times[], minTime?: string): Times[] {
  if (!minTime) return times;

  return times.filter((t) => t.value >= minTime);
}

// gender label
export const genderLabel = (gender: Gender) => {
  return gender == Gender.MALE ? "ذكر" : "أنثى";
};

// total after tax
export const totalAfterTax = (
  cost: number,
  tax: number,
  type: "string" | "number" = "string",
) => {
  // calculate
  return type == "string"
    ? Math.round(cost + (cost * tax) / 100).toFixed(2)
    : Math.round(cost + (cost * tax) / 100);
};

// remove html tags
export function htmlToText(html: string): string {
  return html
    .replace(
      /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<\/?[^>]+>|&nbsp;/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

// calculate how minutes to read
export function minutesToRead(length: number) {
  return Math.round(length / (25 * 60)) || 0;
}

// new order info label
export const orderInfoLabel = (
  user: User | null,
  oid: number | string,
  payment: PaymentState,
  total: number | string,
  tax: number,
  commission: number,
  owner: string,
  cid: number,
) => {
  return `#${oid}'s info | status: ${payment} | total: ${total} | tax: ${tax} | commission: ${commission} | owner: ${owner}-${cid} | modified_at: ${dateTimeToString(
    timeZone().iso,
  )} by (${user ? user.name + " - " + user?.role : "new"})`;
};

// meeting url
export const meetingUrl = (
  oid: number,
  consultant: boolean | undefined,
  session?: number,
) => {
  // return
  return `${mainRoute}/meetings/${zencryption(oid)}?participant=${
    consultant ? "owner" : "client"
  }&session=${session ?? 1}`;
};

// payment method label
export const paymentMethodLabel = (method: PaymentMethod | null) => {
  if (method == PaymentMethod.visaMoyasar) return "فيزا";
  if (method == PaymentMethod.tabby) return "تابي";
  if (method == PaymentMethod.wallet) return "المحفظة";
};

// play sound
export const playRoomSound = (
  event: "join" | "leave" | "toggle-open" | "toggle-close",
) => {
  const audio = new Audio(`/audio/meeting-${event}.mp3`);
  audio.play().catch(console.error);
};

// calculate weighted average rating
export const averageRating = (ratings: number[]): number => {
  // sum of ratings
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);

  // return average
  return sum / ratings.length;
};
