// packages
import { v4 as uuidv4 } from "uuid";

// lib
import prisma from "@/lib/database/db";

// utils
import { generateOtp } from "@/utils/auth";

// lib
// import { notificationSecurityOtp } from "@/lib/notifications";

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

export const getVerificationTokenByPhone = async (phone: string) => {
  try {
    const result = prisma.verificationToken.findFirst({
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
    const token = uuidv4();
    // token expire time one hour
    const expire = new Date(new Date().getTime() + 3600 * 1000);

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
    // await notificationSecurityOtp(newToken.phone, newToken.otp);

    // return
    return newToken;
  } catch {
    // error
    return null;
  }
};
