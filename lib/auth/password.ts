import "server-only";

// packages
import bcrypt from "bcryptjs";
import {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from "better-auth/crypto";

// utils
import { normalizePassword, passwordCandidates } from "@/utils/password";

/**
 * the app's password hash (better-auth's own scrypt, MobileAccount credential), saved trimmed.
 * mobile-auth.ts hands this to better-auth as its password.hash, so every app save uses it too
 * @param password what was typed
 */
export const hashAppPassword = (password: string) =>
  hashBetterAuthPassword(normalizePassword(password));

/**
 * better-auth's password.verify (mobile-auth.ts): the trimmed form, then as typed
 * @param hash the credential's hash
 * @param password what was typed
 */
export async function verifyAppPassword({ hash, password }: { hash: string; password: string }) {
  for (const candidate of passwordCandidates(password)) {
    if (await verifyBetterAuthPassword({ hash, password: candidate })) return true;
  }
  return false;
}

/**
 * the website password hash (bcrypt, users.password) of a password, saved trimmed
 * @param password what was typed
 */
export const hashWebsitePassword = (password: string) =>
  bcrypt.hash(normalizePassword(password), 10);

/**
 * does a typed password match a website hash? tries the trimmed form, then the typed one
 * (utils/password.ts), so passwords saved with spaces before still work
 * @param password what was typed (not trimmed yet)
 * @param hash users.password
 */
export async function matchesWebsitePassword(password: string, hash: string): Promise<boolean> {
  for (const candidate of passwordCandidates(password)) {
    if (await bcrypt.compare(candidate, hash)) return true;
  }
  return false;
}
