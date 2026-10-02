/**
 * routes which will be public for users and accessible for public mostly clients routes
 * @type {string}
 */
export const publicRoutes = [
  // pages
  "/",
  "/contact-us",
  "/centers",
  "/event",
  "/coupons",
  "/terms",
  "/information",
  "/freesessions",
  "/instant",
  "/marriage-awareness",
  "/reels",
  "/discover",
  "/event/eid",
  // public files
  "/llms.txt",
  "/apple-developer-merchantid-domain-association",
  "/.well-known/apple-developer-merchantid-domain-association",
  // site map
  "/sitemap",
  // apis
  "/api/hotline",
  "/api/timezone",
  "/api/revalidate",
  "/api/whatsapp",
  "/api/instant",
  "/api/pusher/webhook",
  "/api/gatewaies/moyasar",
  "/api/gatewaies/tabby",
  "/api/uploadthing",
  "/api/uploadthing/delete",
];

/**
 * routes which will be public and this routes are dynamic
 * @type {string}
 */
export const DynamicpublicRoutes = [
  // pages
  "/consultant",
  "/consultants",
  "/available",
  "/centers",
  "/pay",
  "/payment",
  "/meeting",
  "/meetings",
  "/reschedule",
  "/sessions",
  "/scales",
  "/rooms",
  "/questions",
  "/articles",
  "/preconsultation",
  "/freesession",
  "/freesessions",
  "/programs",
  "/chats",
  "/event",
  // site map
  "/sitemap",
  // apis
  "/api/meetings",
  "/api/whatsapp",
  "/api/uploadthing",
  "/api/cron",
  "/api/mobile",
  "/api/realtime-token",
  "/api/internal",
  "/api/revalidate",
  "/api/online",
  // vercel botid challenge and telemetry (rewritten by withBotId in next.config.ts);
  // guests must reach them, or every guest request is classified as a bot.
  // botid doesn't export this prefix: it's hardcoded in node_modules/botid/dist/next/config
  // (botid 1.5.11). `next build` fails if it's no longer there (checkBotIdPrefix in next.config.ts);
  // the first segment printed here must match:
  // grep -oE '"/[0-9a-f-]{36}/[0-9a-f-]{36}[^"]*"' node_modules/botid/dist/next/config/index.mjs
  "/149e9513-01fa-4fb0-aad4-566afd725d1b",
];

/**
 * routes which will be used for authentication actions
 * @type {string}
 */
export const authRoutes = [
  // auth
  "/login",
  "/register",
  "/verify-otp",
  "/reset-password",
  "/forget-password",
  // admin
  "/management-login",
];

/**
 * prefix for api authentication routes used for api auth
 * Rotues start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * default route to redirect after login
 * @type {string}
 */
