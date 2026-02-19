// packages
import CryptoJS from "crypto-js";

// constants
import { zdencrypt, zencrypt } from "@/constants";

// secret token // later
const secret_token = "sdxcz3214esaczxc32";

// ecrypt (data) into a token
export const encryptToken = (data: string): string => {
  // encrypt data
  const encrypted = CryptoJS.AES.encrypt(data, secret_token).toString();
  // replace unsafe characters for url-safe encryption
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// decrypt token
export const decryptToken = (token: string): string => {
  // retrive the url-safe characters back to the original (base64 token)
  const bToken = token.replace(/-/g, "+").replace(/_/g, "/");
  // padding (base64 padding)
  const padded = bToken + "=".repeat((4 - (bToken.length % 4)) % 4);
  // bytes
  const bytes = CryptoJS.AES.decrypt(padded, secret_token);
  // return
  return bytes.toString(CryptoJS.enc.Utf8);
};

// zencryption (simple order id)
export const zencryption = (id: number) => {
  return String(id)
    .split("")
    .map((i) => zencrypt[+i] ?? "")
    .join("");
};

// dencryption (simple order id)
export const zdencryption = (zid: string) => {
  const result = String(zid)
    .toLowerCase()
    .split("")
    .map((i) => {
      // get digits
      const digit = zdencrypt[i];
      // return
      return digit !== undefined ? digit : null;
    });

  // validate
  if (result.includes(null)) return null;

  return Number(result.join(""));
};

// digits encryption
export const encryptionDigitsToUrl = (data: number) => {
  return encryptToken(zencryption(data));
};

// digits dencryption
export const dencryptionDigitsToUrl = (data: string) => {
  return zdencryption(decryptToken(data));
};
