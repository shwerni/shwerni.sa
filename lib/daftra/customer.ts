import "server-only";

// prisma data
import {
  claimDaftraClient,
  getDaftraClientByPhone,
  releaseDaftraClientClaim,
  setDaftraClientId,
} from "@/data/daftra";

// lib
import { daftraRequest } from "@/lib/daftra/client";
import { internationalPhone, phoneKey } from "@/lib/daftra/format";

export type DaftraCustomerResult =
  | { ok: true; daftraClientId: number }
  | { ok: false; status: "client_not_ready" | "failed" | "review"; error: string };

// one daftra client per customer, keyed by the order's phone (digits only). an existing client
// is reused as it is: its name is never updated from a later order. only the caller that claims
// the row creates the client; a failed or unknown create frees the claim so a later attempt can
// retry (a rare duplicate daftra client is acceptable, a stuck claim is not)
export async function getOrCreateDaftraClient(
  config: { subdomain: string; apiKey: string },
  order: { name: string; phone: string; authorEmail: string | null },
): Promise<DaftraCustomerResult> {
  const phone = phoneKey(order.phone);
  if (phone.length < 8)
    return { ok: false, status: "failed", error: "the order has no usable phone" };

  const existing = await getDaftraClientByPhone(phone);
  if (existing?.daftraClientId)
    return { ok: true, daftraClientId: existing.daftraClientId };
  if (existing)
    return { ok: false, status: "client_not_ready", error: "client create in flight" };

  const claim = await claimDaftraClient(phone, order.name);
  if (!claim.claimed) {
    if (claim.row?.daftraClientId)
      return { ok: true, daftraClientId: claim.row.daftraClientId };
    return { ok: false, status: "client_not_ready", error: "client create in flight" };
  }

  const body = {
    Client: {
      type: 2,
      business_name: order.name,
      first_name: order.name,
      phone1: internationalPhone(phone),
      ...(order.authorEmail && { email: order.authorEmail }),
      country_code: "SA",
      default_currency_code: "SAR",
    },
  };

  const result = await daftraRequest(config, "/clients.json", body);

  if (result.kind === "success") {
    await setDaftraClientId(phone, result.id);
    return { ok: true, daftraClientId: result.id };
  }

  await releaseDaftraClientClaim(phone);
  return result.kind === "failed"
    ? { ok: false, status: "failed", error: `client: ${result.error}` }
    : { ok: false, status: "review", error: `client: ${result.error}` };
}
