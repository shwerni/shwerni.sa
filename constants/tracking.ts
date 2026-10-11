// pages that load no tracking or analytics at all: gtm (and everything its container loads: ga4,
// clarity, tiktok...), the meta, snap and twitter pixels, and vercel speed insights. their url
// carries a private token (the client's pleading case link, /pleading/q/<token>), and clarity
// would record the legal case chat.
// every tracking script checks the path itself when it runs, so the root layout stays static and
// every other page loads exactly as before
export const NO_TRACKING_PATH = /^\/pleading\/q\//;

// the same check as a js expression, for the inline scripts
export const TRACKING_OFF = `${NO_TRACKING_PATH}.test(location.pathname)`;
