import "server-only";

// packages
import bcrypt from "bcryptjs";

// utils
import { normalizePassword, passwordCandidates } from "@/utils/password";

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
