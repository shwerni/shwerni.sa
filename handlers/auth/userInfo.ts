"use server";
// React & Next
import { redirect } from "next/navigation";

// packages
import { z } from "zod";
import bcrypt from "bcryptjs";

// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { getUserByEmail, getUserById, getUserByPhone } from "@/data/user";
import { generateVerificationToken } from "@/data/verificationToken";

// schema
import { PasswordSchema, PhoneSchema, UserSchema } from "@/schemas";
import { mainRoute } from "@/constants/links";

// unauthorized phone number change on the register form
export const unauthorizedPhoneChangeByToken = async (
  data: z.infer<typeof PhoneSchema>,
  oldPhone: string,
  getUrl?: boolean
) => {
  // register fields data { phone }
  const validatePhone = PhoneSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatePhone) return { state: false, message: "something went wrong" };

  // get data
  const { phone } = data;

  // prisma if phone exist
  const phoneExist = await getUserByPhone(phone);

  // phone exist
  if (phoneExist)
    return { state: false, message: "يوجد لدينا حساب مسجل بهذا الرقم" };

  // user
  const user = await prisma.user.findUnique({
    where: { phone: oldPhone },
    select: { phone: true },
  });

  // if token not exist
  if (!user || !user.phone)
    return { state: false, message: "لا يوجد حساب مفعل او خطأ برمز التحقق" };

  // change number
  try {
    // if success then push data to database
    await prisma.user.update({
      where: {
        phone: user.phone,
      },
      data: {
        phone: phone.trim(),
        phoneVerified: null,
        updated_at: new Date(),
      },
    });
    // redirect
  } catch {
    return {
      state: false,
      message: "حدث حطأ ما",
    };
  }
  // generate verification token
  const verificationToken = await generateVerificationToken(phone);

  // if token created
  if (!verificationToken)
    return {
      state: false,
      message: "حدث حطأ ما",
    };

  // replace url (avoid only params change)
  if (getUrl)
    return `${mainRoute}/auth/verify?token=${verificationToken?.token}`;

  // redirect to otp verify page
  redirect(`/auth/verify?token=${verificationToken?.token}`);
};

// change user name and email
export const userInfoChange = async (
  data: z.infer<typeof UserSchema>,
  id: string
) => {
  // register fields data { phone}
  const validatePhone = UserSchema.safeParse(data);

  if (!validatePhone) {
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "something went wrong" };
  }

  if (validatePhone) {
    // get data
    const { username, email } = data;

    // prisma if phone exist
    const exist = await getUserById(id);

    // phone exist
    if (!exist) {
      return { state: false, message: "لا يوجد حساب بهذه المعلومات" };
    }

    // get user by email
    const emailExist = await getUserByEmail(id);
    // if email exist
    if (exist.email !== emailExist?.email && emailExist) {
      return {
        state: false,
        message: "هذا البريد الالكتروني مسجل بحساب اخر بالفعل",
      };
    }
    try {
      // if success then push data to database
      await prisma.user.update({
        where: {
          id,
        },
        data: {
          name: username,
          email: email,
          updated_at: new Date(),
        },
      });
      // return
      return {
        state: true,
        message: "تم حفظ التغييرات",
      };
    } catch (error) {
      return {
        state: false,
        message: "حدث حطأ ما",
      };
    }
  }
};

// change user name and email
export const userPasswrodChange = async (
  data: z.infer<typeof PasswordSchema>,
  id: string
) => {
  // register fields data { phone}
  const validatePhone = PasswordSchema.safeParse(data);

  if (!validatePhone) {
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "something went wrong" };
  }

  if (validatePhone) {
    // get data
    const { password } = data;

    // prisma if phone exist
    const exist = await getUserById(id);

    // phone exist
    if (!exist) {
      return { state: false, message: "لا يوجد حساب بهذه المعلومات" };
    }

    // bcrypt hasing
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // if success then push data to database
      await prisma.user.update({
        where: {
          id,
        },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
        },
      });
      // return
      return {
        state: true,
        message: "تم حفظ التغييرات",
      };
    } catch (error) {
      return {
        state: false,
        message: "حدث حطأ ما",
      };
    }
  }
};
