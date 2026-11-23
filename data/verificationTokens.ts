import "server-only";

// packages
import { timingSafeEqual } from "node:crypto";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { UserRole } from "@/lib/generated/prisma/client";
import type { DbTx } from "@/lib/database/tx";

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
// exists, hasn't expired and hasn't been used. a date parameter (not now()) keeps the compare in
// utc. the used check matters for a second submit at the same moment: it waits on the first's
// row lock, and postgres re-checks only this where clause after the first commits
export const consumeVerificationAttempt = async (token: string) => {
  try {
    const rows = await prisma.$queryRaw<
      { id: string; phone: string; otp: string; attempts: number }[]
    >`
      UPDATE "verification_tokens"
      SET "attempts" = "attempts" + 1
      WHERE "token" = ${token} AND "expire" > ${new Date()} AND "otp" <> ''
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

// a used token keeps its row with an empty otp and an expiry of "now" (it can never match or be
// counted again), so a second submit of the same code can tell "already used" from "no code".
// the row goes when the phone asks for a new code (generateVerificationToken)
const USED_OTP = "";

// claims a live token inside a transaction: only one caller wins (the others see count 0)
const claimToken = (tx: DbTx, id: string) =>
  tx.verificationToken.updateMany({
    where: { id, NOT: { otp: USED_OTP } },
    data: { otp: USED_OTP, expire: new Date() },
  });

/**
 * a token this flow already used (a second submit, another tab), with its phone; null otherwise
 * @param token the token from the url
 */
export const getUsedVerificationToken = async (token: string) => {
  const row = await prisma.verificationToken.findUnique({
    where: { token },
    select: { otp: true, phone: true },
  });
  return row && row.otp === USED_OTP ? { phone: row.phone } : null;
};

/**
 * sign-up / login otp: the token is claimed and the phone verified in one transaction, so a
 * failure leaves the code usable and a second submit can't verify twice. a consultant's own
 * record gets the phone when it exists (a new consultant has none yet; before, that threw after
 * the phone was verified and the user saw "wrong code")
 * @returns "ok", or "taken" when another submit claimed the token first
 */
export const completePhoneVerification = async (tokenId: string, phone: string) =>
  prisma.$transaction(async (tx) => {
    const claimed = await claimToken(tx, tokenId);
    if (claimed.count !== 1) return "taken" as const;

    const user = await tx.user.update({
      where: { phone },
      data: {
        phoneVerified: new Date(),
        // the app's flag (better-auth's phoneNumberVerified) follows the website's
        mobilePhoneVerified: true,
        phone,
      },
      select: { id: true, role: true },
    });

    // a consultant's record follows his phone (only if it exists)
    if (user.role === UserRole.OWNER) {
      await tx.consultant.updateMany({ where: { userId: user.id }, data: { phone } });
    }

    return "ok" as const;
  });

/**
 * forgot-password otp: the token is claimed and the new password saved in one transaction (the
 * phone is verified too, as before)
 * @returns "ok", or "taken" when another submit claimed the token first
 */
export const completePasswordReset = async (
  tokenId: string,
  phone: string,
  hashedPassword: string,
) =>
  prisma.$transaction(async (tx) => {
    const claimed = await claimToken(tx, tokenId);
    if (claimed.count !== 1) return "taken" as const;

    await tx.user.update({
      where: { phone },
      data: {
        phoneVerified: new Date(),
        // the app's flag (better-auth's phoneNumberVerified) follows the website's
        mobilePhoneVerified: true,
        phone,
        password: hashedPassword,
      },
    });

    return "ok" as const;
  });

// constant-time otp compare; different lengths never match
export const otpMatches = (expected: string, given: string) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(String(given ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
};

const getVerificationTokenByPhone = async (phone: string) => {
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
