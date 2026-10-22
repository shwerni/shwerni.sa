// instant sessions are 30 minutes (the instant page only sells cost30); the server enforces it
export const INSTANT_DURATION = 30;

// an instant order's payment window: while it's NEW / PROCESSING and younger than this, its
// consultant can't be booked again; past it, the next booking puts it on HOLD and goes on
export const INSTANT_PAYMENT_WINDOW_MS = 5 * 60_000;

// the first key of pg_advisory_xact_lock(INSTANT_LOCK_NS, cid): booking and paying an instant
// session for one consultant run one at a time
export const INSTANT_LOCK_NS = 7301;

// created instant orders allowed in INSTANT_LIMIT_WINDOW_MS (refused attempts don't count)
export const INSTANT_LIMIT_WINDOW_MS = 10 * 60_000;
export const INSTANT_LIMIT_PER_PHONE = 3;
export const INSTANT_LIMIT_PER_IP = 20;

// the rate_limit key counting an ip's created instant orders
export const instantIpRateKey = (ip: string) => `instant-order:ip:${ip}`;
