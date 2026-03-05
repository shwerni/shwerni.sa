"use server";
// React & Next
import { redirect } from "next/navigation";

// prisma db
import prisma from "@/lib/database/db";

// packages
import { z } from "zod";
import bcrypt from "bcryptjs";

// schemas
import { PhoneSchema, ResetSchema } from "@/schemas";

// lib
import { notificationSecurityOtp } from "@/lib/notifications";

// prisma data
import {
  generateVerificationToken,
  getVerificationTokenByPhone,
} from "@/data/verificationToken";
import { getUserByPhone } from "@/data/user";

export const forgetpassowrd = async (data: z.infer<typeof PhoneSchema>) => {
  // reset fields { newpassword, confirmphone, phone}
  const validatedFields = PhoneSchema.safeParse(data);

  if (!validatedFields.success)
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "برجاء ادخال جميع البيانات" };

  // get data
  const { phone } = validatedFields.data;

  // get user by phone
  const userExist = await getUserByPhone(phone);

  // if user or phone number exist
  if (!userExist) return { state: false, message: "لا يوجد حساب بهذا الرقم" };

  // generate token
  const verificationToken = await generateVerificationToken(phone);

  // if not exist
  if (!verificationToken?.otp || !verificationToken?.phone)
    return { state: false, message: "حدث خطأ ما برجاء اعادة المحاولة" };

  //  send otp via whatsapp
  await notificationSecurityOtp(
    verificationToken?.phone,
    verificationToken?.otp,
  );

  // redirect to otp verify page
  redirect(`/reset-password?token=${verificationToken?.token}`);
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const verifyReset = async (
  data: z.infer<typeof ResetSchema>,
  phone: string,
) => {
  // reset fields { newpassword, confirmphone, phone}
  const validatedFields = ResetSchema.safeParse(data);

  if (!validatedFields.success)
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "برجاء ادخال جميع البيانات" };

  // get data
  const { otp, newpassword, confirmpassword } = validatedFields.data;

  // if password doesnot match
  if (newpassword !== confirmpassword)
    return { state: false, message: "كلمة المرور غير مطابقة" };

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

  // bcrypt hasing
  const hashedPassword = await bcrypt.hash(newpassword, 10);

  // update user phone verified to true
  await prisma.user.update({
    where: { id: userExist?.id },
    data: {
      phoneVerified: new Date(),
      phone: phone,
      password: hashedPassword,
    },
  });

  // delete current token
  await prisma.verificationToken.delete({
    where: { id: tokenExist?.id },
  });

  // redirect to login page
  redirect("/login");
};
