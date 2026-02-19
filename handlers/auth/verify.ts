"use server";
// React & Next
import { redirect } from "next/navigation";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// database data
import {
  generateVerificationToken,
  getVerificationTokenByPhone,
  getVerificationTokenByToken,
} from "@/data/verificationToken";
import { getUserByPhone } from "@/data/user";

// prisma types

export const checkToken = async (token: string) => {
  // check if token exist
  const tokenExist = await getVerificationTokenByToken(token);

  //   if token not exist
  if (!tokenExist)
    return { state: false, message: "لا يوجد كود تفعيل لهذا الحساب" };

  // token expired
  if (new Date(tokenExist.expire) < new Date())
    return { state: false, message: "انتهت صلاحية كود التحقق" };

  // user exist
  const user = await getUserByPhone(tokenExist.phone);

  // if user not exist
  if (!user) return { state: false, message: "لا يوجد حساب بهذا الرقم" };

  // success without message
  return { phone: user.phone, name: user.name, otp: tokenExist.otp };
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const verifyToken = async (phone: string, otp: string) => {
  try {
    // user exist
    const userExist = await getUserByPhone(phone);

    // check if token exist
    const tokenExist = await getVerificationTokenByPhone(phone);

    // if token and user exist
    if (!tokenExist && !userExist)
      return { state: false, message: "لا يوجد كود تفعيل لهذا الحساب" };

    // if otp is not matched
    if (tokenExist?.otp !== otp)
      return { state: false, message: "رمز التحقق خطأ" };

    // update user phone verified to true
    const user = await prisma.user.update({
      where: { id: userExist?.id },
      data: {
        phoneVerified: new Date(),
        phone,
      },
    });

    // if owner update phone number
    if (user.role == UserRole.OWNER) {
      await prisma.consultant.update({
        where: { userId: userExist?.id },
        data: {
          phone,
        },
      });
    }

    // delete current token
    await prisma.verificationToken.delete({
      where: { id: tokenExist?.id },
    });

    // return { state: true, message: "تم التحقق بنجاح" };
  } catch (error) {
    // error
    return { state: false, message: "حدث خطأ ما في الصفحة" };
  }
  // redirect
  redirect(`/login`);
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const phoneToken = async (phone: string) => {
  // generate one
  const verificationToken = await generateVerificationToken(phone);

  // redirect
  redirect(`/verify-otp?token=${verificationToken?.token}`);
};
