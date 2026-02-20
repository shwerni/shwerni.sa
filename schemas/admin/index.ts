// pacakges
import { z } from "zod";

// schemas
import { schemas } from "@/schemas/schemas";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  PaymentMethod,
  UserRole,
} from "@/lib/generated/prisma/enums";

// edit order schema
export const OrderSchema = z.object({
  status: z.string().min(2, {
    message: "not less than 2",
  }),
  name: z.string().min(2, {
    message: "not less than 2",
  }),
  duration: z.string({
    required_error: "select duration",
  }),
  total: z.coerce.number().positive().safe(),
  tax: z.coerce.number().positive().safe(),
  commission: z.coerce.number().positive().safe(),
  notify: z.boolean().default(false).optional(),
  // phone
  phone: z.string().min(2, {
    message: "not less than 2",
  }),
});

// edit order schema
export const MeetingSchema = z.object({
  time: z.string(),
  done: z.boolean().default(false),
  consultantAttendance: z.boolean().default(false),
  clientAttendance: z.boolean().default(false),
  clientJoinedAt: z.string(),
  consultantJoinedAt: z.string(),
  url: z.string(),
});

// edit order schema
export const FreeSessionSchema = z.object({
  ownerAttend: z.boolean().default(false),
  clientAttend: z.boolean().default(false),
  clientATime: z.string(),
  ownerATime: z.string(),
  url: z.string(),
});

// edit owner schema
export const OwnerSchema = z.object({
  // admin
  author: z.string({
    required_error: "select author",
  }),
  status: z.boolean({
    required_error: "select status",
  }),
  // notify owner
  notify: z.boolean(),
  // owner approval
  approved: z.nativeEnum(ApprovalState, {
    required_error: "select status",
  }),
  statusA: z.nativeEnum(ConsultantState, {
    required_error: "select status",
  }),
  commission: z.coerce.number().safe(),
  rate: z.coerce.number().safe(),
  // phone
  phone: schemas.phone,
  // username
  name: schemas.username,
  // title
  title: z
    .string()
    .min(8, {
      message: "minimum 8 characters",
    })
    .max(25, {
      message: "maximum 25 characters",
    }),
  // categories
  category: z.nativeEnum(Categories, {
    required_error: "select category",
  }),
  // genders
  gender: z.nativeEnum(Gender, {
    required_error: "select gender",
  }),
  // cost 30
  cost30: z.coerce.number().positive().safe().min(0, {
    message: "cost can't be zero",
  }),
  // cost 45
  cost45: z.coerce.number().positive().safe().min(0, {
    message: "cost can't be zero",
  }),
  // cost 60
  cost60: z.coerce.number().positive().safe().min(0, {
    message: "cost can't be zero",
  }),
  // admi note
  adminNote: z.string(),
  nabout: z.string().max(150, "النبذة القصيرة لا تتجاوز 150 حرف").optional(),

  neducation: z
    .array(
      z
        .string()
        .trim()
        .min(5, "يجب ان يتكون المؤهل من 5 احرف علي الاقل")
        .max(50, "المؤهل لا يمكن أن يزيد عن 50 حرفًا"),
    )
    .min(1, "يجب إدخال مؤهل واحد على الأقل")
    .max(3, "يمكنك إضافة حتى 3 مؤهلات فقط"),

  nexperiences: z
    .array(
      z
        .string()
        .trim()
        .min(5, "يجب ان تتكون الخبرة من 5 احرف علي الاقل")
        .max(50, "الخبرة لا يمكن أن تزيد عن 50 حرفًا"),
    )
    .min(1, "يجب إدخال خبرة واحدة على الأقل")
    .max(3, "يمكنك إضافة حتى 3 خبرات فقط"),
});

// edit user schema
export const UserAdminSchema = z.object({
  id: z.string({
    required_error: "select image",
  }),
  role: z.nativeEnum(UserRole),
  image: z.string({
    required_error: "select image",
  }),
  // phone
  phone: schemas.phone,
  // username
  name: schemas.username,
  // title
  email: z.string({
    required_error: "select image",
  }),
  phoneVerified: z.string({
    required_error: "select image",
  }),
  password: z.string({
    required_error: "select image",
  }),
});

// edit review schema
export const reviewSchema = z.object({
  status: z.string().min(2, {
    message: "not less than 2",
  }),
  name: z.string().min(2, {
    message: "not less than 2",
  }),
  author: z.string().min(2, {
    message: "not less than 2",
  }),
  comment: z.string().min(5, {
    message: "not less than 5",
  }),
  date: z.string().min(5, {
    message: "not less than 5",
  }),
  rate: z.coerce.number().positive().safe(),
});

// admin settings
export const settingsSchema = z.object({
  tax: z.coerce.number().positive().safe(),
  commission: z.coerce.number().positive().safe(),
  payments: z
    .array(z.nativeEnum(PaymentMethod))
    .default([PaymentMethod.visaMoyasar]),
  coupon: z.boolean().default(false),
});

// chat
export const chatSchema = z.object({
  message: z.string(),
});
