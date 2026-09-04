// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { mintRealtimeToken } from "@/lib/api/realtime/mint-token";
import { createGetRoute } from "@/lib/api/routes/create-get-route";

// maps the full UserRole space down to what the realtime gateway
// actually needs to distinguish for presence counting
function toRealtimeRole(
  role: string | null | undefined,
): "USER" | "OWNER" | "GUEST" {
  if (role === "OWNER") return "OWNER";
  if (role !== undefined && role !== null) return "USER";
  return "GUEST";
}

export const GET = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);
  const token = await mintRealtimeToken(user.id, toRealtimeRole(user.role));
  return { token };
});
