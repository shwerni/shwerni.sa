import "server-only";

// packages
import { timingSafeEqual } from "node:crypto";

// prisma db
import prisma from "@/lib/database/db";

// utils
import { generateOtp } from "@/utils/auth";

// prisma data
import { notificationSecurityOtp } from "@/lib/notifications/site";

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const result = prisma.verificationToken.findUnique({
      where: { token },
    });
    return result;
  } catch {
    return null;
  }
};

// wrong otp tries allowed before the token is deleted
export const MAX_OTP_ATTEMPTS = 5;

// one atomic query per verify: counts the attempt and reads the token, only while it
// exists and hasn't expired. a date parameter (not now()) keeps the compare in utc
export const consumeVerificationAttempt = async (token: string) => {
  try {
    const rows = await prisma.$queryRaw<
      { id: string; phone: string; otp: string; attempts: number }[]
    >`
      UPDATE "verification_tokens"
      SET "attempts" = "attempts" + 1
      WHERE "token" = ${token} AND "expire" > ${new Date()}
      RETURNING "id", "phone", "otp", "attempts"
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
};

// delete a token after use or after too many wrong tries (a parallel request may have deleted it already)
export const deleteVerificationToken = async (id: string) => {
  await prisma.verificationToken.deleteMany({ where: { id } });
};

// constant-time otp compare; different lengths never match
export const otpMatches = (expected: string, given: string) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(String(given ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
};

export const getVerificationTokenByPhone = async (phone: string) => {
  try {
    const result = await prisma.verificationToken.findFirst({
      where: { phone },
    });
    return result;
  } catch {
    return null;
  }
};

export const generateVerificationToken = async (phone: string) => {
  try {
    // generate otp one time password
    const otp = String(generateOtp());
    // generate token using uuid
    const token = crypto.randomUUID();
    // token expire time ten minutes (the token travels in the url)
    const expire = new Date(new Date().getTime() + 600 * 1000);

    // check if token exist
    const tokenExsit = await getVerificationTokenByPhone(phone);
    // if token exist delete
    if (tokenExsit) {
      await prisma.verificationToken.delete({
        where: {
          id: tokenExsit.id,
        },
      });
    }
    //  if not create a token
    const newToken = await prisma.verificationToken.create({
      data: {
        phone,
        token,
        expire,
        otp,
      },
    });

    //  get user name
    const userName = await prisma.user.findUnique({
      where: {
        phone: phone,
      },
      select: {
        name: true,
      },
    });

    // send otp via whatsapp
    await notificationSecurityOtp(
      newToken.phone,
      userName?.name || "",
      newToken.otp,
    );

    // return
    return newToken;
  } catch {
    // error
    return null;
  }
};
