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
  // apis
  "/api/hotline",
  "/api/timezone",
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
  "/rooms",
  "/questions",
  "/blogs",
  "/articles",
  "/brief",
  "/preconsultation",
  "/freesession",
  "/freesessions",
  "/programs",
  "/sessions",
  // apis
  "/api/whatsapp",
  "/api/uploadthing",
  "/api/cron",
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