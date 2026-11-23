// the website session (nextauth, jwt): how long a login lasts. jwt.maxAge isn't set, so the token's
// own expiry follows this value (@auth/core init). the app's sessions (better-auth) are separate
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
