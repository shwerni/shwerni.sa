// packages
import crypto from "crypto";

// generate random secure otp 5 digits
export const generateOtp = () => {
  const otp = crypto.randomInt(10000, 99999);
  return otp;
};
