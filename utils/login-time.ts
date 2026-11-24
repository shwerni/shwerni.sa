/**
 * the login time (ms) of a website session token: its authAt claim (set at the login and kept when
 * the token is re-issued), or, for a token from before that claim, its issue time (iat, seconds)
 * @param token the decoded next-auth jwt
 * @returns ms since the epoch, or undefined when the token has neither
 */
export const loginTime = (token: { authAt?: unknown; iat?: unknown }): number | undefined => {
  if (typeof token.authAt === "number") return token.authAt;
  if (typeof token.iat === "number") return token.iat * 1000;
  return undefined;
};
