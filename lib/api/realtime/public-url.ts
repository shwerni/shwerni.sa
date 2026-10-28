import "server-only";

// the realtime server's address for the browser, from the server-only BACKEND_URL (the same
// server the site calls), without a trailing slash. null when it isn't set: the token routes then
// answer an error, and the browser never falls back to another address
export function realtimePublicUrl(): string | null {
  const url = process.env.BACKEND_URL?.trim().replace(/\/+$/, "");
  return url ? url : null;
}
