// types
import { Lang } from "@/types/types";

// utils
import { withTax } from "@/utils/tax";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  PaymentMethod,
  PaymentState,
  Relation,
  ReviewState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// types
import { User } from "next-auth";
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
import { dateTimeToString } from "./time";
import { mainRoute } from "@/constants/links";

// packages
import crypto from "crypto";
import { Participant } from "@/lib/generated/prisma/client";

// create random id
export const randomId = (length: number = 10) =>
  crypto.randomBytes(length / 2).toString("hex");

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

// gender label
export const genderLabel = (gender: Gender) => {
  return gender == Gender.MALE ? "ذكر" : "أنثى";
};

// gender label
export const consultantGenderLabel = (gender: Gender) => {
  return gender == Gender.MALE ? "مستشار" : "مستشارة";
};

// total after tax: display wrapper around the shared withTax, no tax math of its own.
// tax 0 means the amount is already final (currency labels), anything else applies TAX_PERCENT
export const totalAfterTax = (
  cost: number,
  tax: number = 15,
  type: "string" | "number" = "string",
) => {
  // calculate
  const value = tax === 0 ? Math.round(cost) : withTax(cost);
  return type == "string" ? value.toFixed(2) : value;
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
export const meetingUrl = (mid: string, participant: string) => {
  // return
  return `${mainRoute}meetings/${mid}?participant=${participant}`;
};

// get participant by role
export const findParticipant = (
  participants: Participant[],
  role: UserRole = UserRole.USER,
) => {
  // return
  return participants.find((u) => u.role === role);
};

// payment method label
export const paymentMethodLabel = (method: PaymentMethod | null) => {
  if (method == PaymentMethod.visaMoyasar) return "فيزا";
  if (method == PaymentMethod.tabby) return "تابي";
  if (method == PaymentMethod.wallet) return "المحفظة";
};

// relation labels
export const relationLabel = (relation: Relation) => {
  switch (relation) {
    case Relation.SPOUSE:
      return "زوج / زوجة";
    case Relation.PARENT:
      return "أب / أم";
    case Relation.SIBLING:
      return "أخ / أخت";
    case Relation.CHILD:
      return "ابن / ابنة";
    case Relation.RELATIVE:
      return "قريب";
    case Relation.FRIEND:
      return "صديق";
    case Relation.COLLEAGUE:
      return "زميل عمل";
    default:
      return "أخرى";
  }
};
