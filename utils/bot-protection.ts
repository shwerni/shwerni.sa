// Single source of truth for BotID, shared by instrumentation-client.ts.
//
// Server Actions POST to the URL of the page they're called from, so BotID
// matches the PAGE path, not the action. Every page that calls an action with
// `bot` set in createAction must be listed here, or checkBotId() fails there
// and real users get blocked. Wildcards match one or more segments.
//
// Replace these with your real routes.
export const BOT_PROTECTED_PATHS = [
  // auth
  "/login",
  "/register",
  "/forget-password",
  // pages that open the guest booking flow
  "/consultants/*",
] as const;
