"use server";
// React & Next
import { redirect } from "next/navigation";

// packages
import bcrypt from "bcryptjs";

// prisma tyeps
import { UserRole } from "@/lib/generated/prisma/enums";

// database data
import { createUser, getUserByPhone } from "@/data/user";
import { generateVerificationToken } from "@/data/verificationToken";

export const register = async (
  role: UserRole,
  username: string,
  email: string | undefined,
  phone: string,
  password: string
) => {
  // bcrypt hasing
  const hashedPassword = await bcrypt.hash(password, 10);

  // prisma if phone exist
  const phoneExist = await getUserByPhone(phone);

  // phone exist
  if (phoneExist) return { state: false, message: "رقم الهاتف موجود بالفعل" };

  try {
    // if success then push data to database
    await createUser(role, username, email, phone, hashedPassword);
  } catch {
    return {
      state: false,
      message: "حدث حطأ ما",
    };
  }
  // generate verification token
  const verificationToken = await generateVerificationToken(phone);

  // if not exist
  if (!verificationToken)
    return {
      state: false,
      message: "حدث حطأ ما",
    };

  // redirect to otp verify page
  redirect(`/verify-otp?token=${verificationToken.token}`);
};
