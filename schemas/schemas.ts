// pacakges
import { z } from "zod";

// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

// repeated schemas
export const schemas = {
  // name
  name: z
    .string()
    .trim()
    .min(3, {
      message: "اسم المستخدم يجب ان يتكون من 3 احرف علي الاقل",
    })
    .max(12, {
      message: "12 حرف كحد اقصي",
    })
    .refine((val) => val.trim().length > 0, {
      message: "الاسم مطلوب",
    }),
  // username
  username: z
    .string()
    .trim()
    .min(3, {
      message: "اسم المستخدم يجب ان يتكون من 3 احرف علي الاقل",
    })
    .max(20, {
      message: "20 حرف كحد اقصي",
    }),
  // phone
  phone: z
    .string()
    .trim()
    .min(9, {
      message: "رقم الهاتف يجب أن يتكون 9 رقماً علي الاقل ",
    })
    .max(15, {
      message: "رقم الهاتف يجب أن يتكون 15 رقماً بحد اقصي",
    })
    .refine((val) => val.trim().length > 0, {
      message: "رقم الهاتف مطلوب",
    }),
  // password
  password: z.string().trim().min(6, {
    message: "كلمة المرور قصيرة جدا",
  }),
  // categories
  category: z.nativeEnum(Categories, {
    required_error: "خلل في اختيار النوع",
  }),
};
