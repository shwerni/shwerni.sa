// packages
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";
import { cooldownDays, cooldownMessage, cooldownThreshold } from "@/utils/user";

// convert arabic-indic and persian digits to latin, drop everything else
const toDigits = (text: string) =>
  text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/\D/g, "");

const schema = z.object({
  phone: z
    .string()
    .transform(toDigits)
    .pipe(z.string().regex(/^05\d{8}$/)),
});



// update phone, allowed once every 10 days
export const POST = createPostRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  // never write without a session user id, prisma drops undefined filters
  if (!id) throw new HttpError("غير مصرح", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError("رقم الجوال غير صالح", 400);
  const { phone } = parsed.data;

  const current = await prisma.user.findUnique({
    where: { id },
    select: { phone: true },
  });
  if (current?.phone === phone)
    throw new HttpError("الرقم الجديد مطابق للرقم الحالي", 400);

  try {
    // atomic: cooldown check and write happen in a single statement
    const { count } = await prisma.user.updateMany({
      where: {
        id,
        OR: [
          { phoneChangedAt: null },
          { phoneChangedAt: { lte: cooldownThreshold() } },
        ],
      },
      data: { phone, phoneVerified: null, phoneChangedAt: new Date() },
    });

    if (count === 0) {
      const last = await prisma.user.findUnique({
        where: { id },
        select: { phoneChangedAt: true },
      });
      throw new HttpError(
        cooldownMessage(
          "رقم الجوال",
          cooldownDays(last?.phoneChangedAt ?? null),
        ),
        429,
      );
    }
  } catch (e) {
    // unique constraint on phone
    if ((e as { code?: string }).code === "P2002")
      throw new HttpError("رقم الجوال مستخدم بالفعل", 409);
    throw e;
  }

  return { ok: true };
});
