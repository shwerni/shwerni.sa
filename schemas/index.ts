// packages
import { z } from "zod";

// prisma types
import {
  Gender,
  GenderPreference,
  OrderType,
  PaymentMethod,
  Weekday,
} from "@/lib/generated/prisma/enums";

// schemas
import { schemas } from "@/schemas/schemas";

// consultant profile form & schema
export const ConsultantSchema = z.object({
  // username
  name: schemas.username,
  // title
  title: z
    .string()
    .trim()
    .min(8, {
      message: "العنوان يجب ان يتكون من 8 احرف علي الاقل",
    })
    .max(25, {
      message: "25 حرف كحد اقصي",
    }),
  // categories
  category: schemas.category,
  // genders
  gender: z.nativeEnum(Gender, {
    required_error: "خلل في اختيار الفئة",
  }),
  // cost 30
  cost30: z.coerce.number().positive().safe().min(109, {
    message: "يجب أن تكون التكلفة 109 على الأقل",
  }),
  // cost 45
  cost45: z.coerce.number().positive().safe().min(143, {
    message: "يجب أن تكون التكلفة 143 على الأقل",
  }),
  // cost 60
  cost60: z.coerce.number().positive().safe().min(164, {
    message: "يجب أن تكون التكلفة 165 على الأقل",
  }),
  // bank name
  bankName: z
    .string()
    .trim()
    .min(8, {
      message: "يجب ان يتكون من 8 احرف علي الاقل",
    })
    .max(40, {
      message: "40 حرف كحد اقصي",
    }),
  // bank iban number
  iban: z
    .string()
    .min(24, {
      message: "يجب ان يتكون من 24 احرف علي الاقل",
    })
    .max(40, {
      message: "40 حرف كحد اقصي",
    }),

  // new data
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

  preference: z.nativeEnum(GenderPreference).optional(),
});

// user schema
// Register
export const RegisterSchema = z.object({
  // username
  username: schemas.username,
  // email
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 || z.string().email().safeParse(value).success,
      {
        message: "عنوان بريد الكتروني خاطئ",
      },
    )
    .optional(),
  // phone
  phone: schemas.phone,
  // password
  password: schemas.password,
});

// login
export const LogInSchema = z.object({
  // phone
  phone: schemas.phone,
  // password
  password: schemas.password,
});

// just phone
export const PhoneSchema = z.object({
  // phone
  phone: schemas.phone,
});

// username and email
export const UserSchema = z.object({
  // username
  username: schemas.username,
  // email
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 || z.string().email().safeParse(value).success,
      {
        message: "عنوان بريد الكتروني خاطئ",
      },
    )
    .optional(),
});

// just password
export const PasswordSchema = z.object({
  // new password
  password: schemas.password,
});

// forget passwrod reset
export const ResetSchema = z
  .object({
    // new password
    newpassword: schemas.password,
    // confirmpassword
    confirmpassword: schemas.password,
    // otp
    otp: z.string().min(5, {
      message: "يجب ادخال 5 ارقام علي الاقل",
    }),
  })
  .refine((data) => data.newpassword === data.confirmpassword, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirmpassword"],
  });

// Verify Otp
export const OtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(5, "الرجاء إدخال رمز مكون من 5 أرقام")
    .regex(/^\d{5}$/, "الرمز يجب أن يكون أرقام فقط"),
});

// reservation
export const Reservation = z
  .object({
    name: schemas.name,
    phone: schemas.phone,
    description: z.string().max(500, {
      message: "500 حرف كحد اقصي",
    }),
    isGift: z.boolean().default(false),
    giftName: z.string().optional(),
    giftPhone: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isGift) return true;
      return !!data.giftName;
    },
    {
      message: "يجب إدخال اسم المستلم",
      path: ["giftName"],
    },
  )
  .refine(
    (data) => {
      if (!data.isGift) return true;
      return !!data.giftPhone;
    },
    {
      message: "يجب إدخال رقم هاتف المستلم",
      path: ["giftPhone"],
    },
  )
  .refine(
    (data) => {
      if (!data.isGift || !data.giftPhone) return true;
      return schemas.phone.safeParse(data.giftPhone).success;
    },
    {
      message: "رقم الهاتف يجب أن يتكون بين 10 و 12 رقماً",
      path: ["giftPhone"],
    },
  )
  .refine(
    (data) => {
      if (!data.isGift || !data.giftName) return true;
      return schemas.name.safeParse(data.giftName).success;
    },
    {
      message: "اسم المستلم يجب أن يكون بين 3 و 12 حرفاً",
      path: ["giftName"],
    },
  );

// consultant profile form & schema
export const InstantSchema = z.object({
  // state
  status: z.boolean().default(false),
  // cost
  cost: z.coerce.number().positive().safe().min(80, {
    message: "يجب أن تكون التكلفة 80 على الأقل",
  }),
});

// free session
export const FreeSession = z.object({
  name: schemas.name,
  phone: schemas.phone,
});

// reservation consultation answer
export const ConsultationAnswer = z.object({
  answer: z
    .string()
    .min(15, {
      message: "يجب ان يتكون من 15 احرف علي الاقل",
    })
    .max(500, {
      message: "500 حرف كحد اقصي",
    }),
});

// client issue
export const ClientIssue = z.object({
  name: schemas.name,
  phone: schemas.phone,
  issue: z
    .string()
    .min(15, {
      message: "يجب ان يتكون من 15 احرف علي الاقل",
    })
    .max(750, {
      message: "750 حرف كحد اقصي",
    }),
});

// reservation consultation answer
export const AdvisorResponse = z.object({
  response: z
    .string()
    .min(15, {
      message: "يجب ان يتكون من 15 احرف علي الاقل",
    })
    .max(750, {
      message: "750 حرف كحد اقصي",
    }),
});

// comment
export const CommentSchema = z.object({
  // name
  name: schemas.name,
  // comment
  comment: z.string().trim().min(15, {
    message: "التعليق قصيرة جدا",
  }),
});

// terms and conditions
export const PaymentSchema = z.object({
  terms: z.boolean().default(false).optional(),
  wallet: z.boolean().default(false).optional(),
});

export const discountSchema = z.object({
  coupon: z.boolean().default(false).optional(),
  code: z.string().trim().length(6, {
    message: "يجب أن يكون الكود مكونا من 6 أرقام",
  }),
});

export const QuestionSchema = z.object({
  anonymous: z.boolean().default(true),
  title: z
    .string()
    .min(15, {
      message: "يجب ان يتكون من 15 احرف علي الاقل",
    })
    .max(75, {
      message: "75 حرف كحد اقصي",
    }),
  question: z
    .string()
    .min(15, {
      message: "يجب ان يتكون من 15 احرف علي الاقل",
    })
    .max(750, {
      message: "750 حرف كحد اقصي",
    }),
  category: schemas.category,
});

export const ProgramSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  summary: z.string().min(1, "الملخص مطلوب"),
  duration: z.number().min(1, "المدة مطلوبة"),
  description: z.string().min(1, "الوصف مطلوب"),
  price: z.coerce.number().positive().safe().min(500, {
    message: "يجب أن تكون التكلفة 500 على الأقل",
  }),
  sessions: z.number().min(1, "عدد الجلسات مطلوب"),
  features: z.array(z.string().min(1)).min(1, "يجب إدخال ميزة واحدة على الأقل"),
  category: schemas.category,
});

// new
export const reservationSchema = z
  .object({
    // ui /ux data
    order: z.string(),
    user: z.string(),
    cid: z.number(),
    consultant: z.string(),
    unavailable: z.array(z.nativeEnum(Weekday)),
    cost: z.object({
      30: z.number().positive(),
      60: z.number().positive(),
    }),
    times: z
      .object({
        late: z.array(z.string()).optional(),
        day: z.array(z.string()).optional(),
        noon: z.array(z.string()).optional(),
        night: z.array(z.string()).optional(),
      })
      .partial(),
    finance: z.object({
      tax: z.number().min(0),
      commission: z.number().min(0),
      payments: z.array(z.nativeEnum(PaymentMethod)),
      couponEnabled: z.boolean(),
    }),
    type: z.nativeEnum(OrderType).default(OrderType.SCHEDULED),

    // step 1
    date: z.date({
      required_error: "التاريخ مطلوب",
    }),

    time: z
      .string({
        required_error: "الوقت مطلوب",
      })
      .min(1, "الوقت مطلوب"),
    // step 2
    duration: z
      .string()
      .default("30")
      .refine((v) => ["30", "60"].includes(v), { message: "مدة غير صالحة" }),

    // basic info
    name: schemas.name,
    phone: schemas.phone,
    notes: z.string().max(200, {
      message: "200 حرف كحد اقصي",
    }),

    // beneficiary optional info
    hasBeneficiary: z.boolean().default(false),
    beneficiaryName: z.string().optional(),
    beneficiaryPhone: z.string().optional(),

    // step 3
    method: z.nativeEnum(PaymentMethod, {
      required_error: "برجاء اختيار طريقة دفع",
    }),
    hasCoupon: z.boolean().default(false),
    couponCode: z.string().optional(),
    couponPercent: z.number().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "يجب قبول الشروط والأحكام" }),
    }),
  })
  .superRefine((data, ctx) => {
    // Beneficiary validation
    if (data.hasBeneficiary) {
      if (!data.beneficiaryName) {
        ctx.addIssue({
          path: ["beneficiaryName"],
          code: z.ZodIssueCode.custom,
          message: "يجب إدخال اسم المستلم",
        });
      } else if (!schemas.name.safeParse(data.beneficiaryName).success) {
        ctx.addIssue({
          path: ["beneficiaryName"],
          code: z.ZodIssueCode.custom,
          message: "اسم المستلم يجب أن يكون بين 3 و 12 حرفاً",
        });
      }

      if (!data.beneficiaryPhone) {
        ctx.addIssue({
          path: ["beneficiaryPhone"],
          code: z.ZodIssueCode.custom,
          message: "يجب إدخال رقم هاتف المستلم",
        });
      } else if (!schemas.phone.safeParse(data.beneficiaryPhone).success) {
        ctx.addIssue({
          path: ["beneficiaryPhone"],
          code: z.ZodIssueCode.custom,
          message: "رقم الهاتف يجب أن يتكون بين 10 و 12 رقماً",
        });
      }
    }

    // coupon validation
    if (data.hasCoupon) {
      if (!data.couponCode) {
        ctx.addIssue({
          path: ["couponCode"],
          code: z.ZodIssueCode.custom,
          message: "يجب إدخال كود الخصم",
        });
      } else if (data.couponCode.length !== 6) {
        ctx.addIssue({
          path: ["couponCode"],
          code: z.ZodIssueCode.custom,
          message: "يجب أن يكون كود الخصم مكوناً من 6 أحرف",
        });
      }
    }
  });

export type ReservationFormType = z.infer<typeof reservationSchema>;

// new
export const programReservationSchema = z
  .object({
    // ui/ux data
    user: z.string(),
    order: z.string(),
    prid: z.number(),
    sessions: z.number(),
    times: z
      .object({
        late: z.array(z.string()).optional(),
        day: z.array(z.string()).optional(),
        noon: z.array(z.string()).optional(),
        night: z.array(z.string()).optional(),
      })
      .partial(),
    finance: z.object({
      tax: z.number().min(0),
      commission: z.number().min(0),
      payments: z.array(z.nativeEnum(PaymentMethod)),
      couponEnabled: z.boolean(),
    }),
    cost: z.number(),
    duration: z.number(),

    // step 1
    name: schemas.name,
    phone: schemas.phone,
    cid: z.number(),
    consultant: z.string(),

    // step 2
    date: z.date({
      required_error: "التاريخ مطلوب",
    }),
    time: z
      .string({
        required_error: "الوقت مطلوب",
      })
      .min(1, "الوقت مطلوب"),

    // step 3
    method: z.nativeEnum(PaymentMethod, {
      required_error: "برجاء اختيار طريقة دفع",
    }),
    hasCoupon: z.boolean().default(false),
    couponCode: z.string().optional(),
    couponPercent: z.number().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "يجب قبول الشروط والأحكام" }),
    }),
  })
  .superRefine((data, ctx) => {
    // coupon validation
    if (data.hasCoupon) {
      if (!data.couponCode) {
        ctx.addIssue({
          path: ["couponCode"],
          code: z.ZodIssueCode.custom,
          message: "يجب إدخال كود الخصم",
        });
      } else if (data.couponCode.length !== 6) {
        ctx.addIssue({
          path: ["couponCode"],
          code: z.ZodIssueCode.custom,
          message: "يجب أن يكون كود الخصم مكوناً من 6 أحرف",
        });
      }
    }
  });

export type ProgramReservationFormType = z.infer<
  typeof programReservationSchema
>;

// username and email
export const UserInfoSchema = z.object({
  // username
  name: schemas.username,
  // username
  phone: schemas.phone,
  // email
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "عنوان بريد الكتروني خاطئ",
    }),
  // new password
  password: schemas.password,
});

export type UserInfoSchemaType = z.infer<typeof UserInfoSchema>;
