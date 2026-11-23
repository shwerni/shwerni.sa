// where a login may send the user back to: only the consultant's meeting and chat pages (the
// links that now need his login). anything else, another site, or a protocol-relative url → null,
// and the login keeps its role redirect
const ALLOWED_PREFIXES = ["/meetings/", "/dashboard/chats/"];

/**
 * the safe callback path, or null
 * @param value the callbackUrl query value
 */
export function safeCallbackUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if ([...value].some((c) => c.charCodeAt(0) < 32)) return null;
  return ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix)) ? value : null;
}

/**
 * a page path with the callback kept, when it's safe
 * @param path the page, e.g. "/login"
 * @param callbackUrl the callback to carry
 */
export function withCallbackUrl(path: string, callbackUrl: unknown): string {
  const safe = safeCallbackUrl(callbackUrl);
  if (!safe) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}callbackUrl=${encodeURIComponent(safe)}`;
}
