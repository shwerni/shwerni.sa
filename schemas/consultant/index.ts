// packages
import { z } from "zod";

// consultant's coupon create schema 
export const couponConsultantSchema = z.object({
    code: z.string().length(6, "الرمز يجب أن يكون مكوناً من ٦ أحرف"),
    discount: z
        .number()
        .min(1, "الخصم يجب أن يكون أكثر من 0")
        .max(50, "الخصم الأقصى المسموح به هو 50%"),
    limits: z.number().min(1).positive(),
    starts_at: z.date().optional().nullable(),
    expires_at: z.date().optional().nullable(),
});