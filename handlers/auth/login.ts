"use server";
// React & Next
import { redirect } from "next/navigation";

// next auth
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// utils
import { phoneNumber } from "@/utils";

// prisma data
import { getUserLogin } from "@/data/user";
import { generateVerificationToken } from "@/data/verificationToken";

// prisma types
import { UserRole } from "@/lib/generated/prisma/client";

export const login = async (
  phone: string,
  password: string,
  administrator: boolean = false
) => {
  // validate
  if (!phone || !password)
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "برجاء ادخال جميع البيانات" };

  // get user by phone
  const userExist = await getUserLogin(phoneNumber(phone), administrator);

  // if user or phone not exist
  if (!userExist || !userExist.phone || !userExist.password)
    return { state: false, message: "لا يوجد حساب بهذا الرقم" };

  // if token not verifyed
  if (!userExist.phoneVerified) {
    // generate one
    const verificationToken = await generateVerificationToken(userExist.phone);

    // if not exist
    if (!verificationToken)
      return {
        state: false,
        message: "حدث حطأ ما",
      };

    // signin and redirect to reverify
    redirect(`/auth/verify?token=${verificationToken.token}`);
  }

  try {
    // if success signin & phone already verifed
    await signIn("credentials", {
      phone,
      password,
      redirectTo:
        userExist?.role === UserRole.ADMIN
          ? "/zadmin"
          : userExist?.role === UserRole.OWNER
          ? "/dashboard"
          : "/",
      // redirectTo: LogInRedirect,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            state: false,
            message: "اسم المستخدم او كلمة المرور غير متطابقين",
          };
        default:
          return {
            state: false,
            message: "اسم المستخدم او كلمة المرور غير متطابقين",
          };
      }
    }
    throw error;
  }
};
