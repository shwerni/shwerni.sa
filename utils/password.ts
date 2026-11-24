/**
 * the one form a password is saved in, on the website and the app: without leading or trailing
 * spaces (the website login always trimmed what was typed)
 * @param password what was typed
 */
export const normalizePassword = (password: string) => password.trim();

/**
 * the forms a login tries, each once: the trimmed one, then, only when it differs, the password
 * exactly as typed. a password saved with its spaces before saving was consistent still logs in
 * @param password what was typed
 */
export const passwordCandidates = (password: string): string[] => {
  const trimmed = normalizePassword(password);
  return trimmed === password ? [trimmed] : [trimmed, password];
};
