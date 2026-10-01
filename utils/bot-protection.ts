// single source of truth for botid's client protect list, read by instrumentation-client.ts.
//
// server actions post to the url of the page they're called from, so botid matches the
// page path, not the action. "/*" also matches "/" and covers every page; botid only adds
// its headers to same-origin requests, so cross-origin calls (uploadthing, backend) are untouched.
// the server side check is checkHuman() in lib/bot-protection.ts.
export const BOT_PROTECTED_PATHS = ["/*"] as const;
