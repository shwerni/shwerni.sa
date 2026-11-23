import "server-only";

// constants
import { INSTANT_LOCK_NS } from "@/constants/instant";

// types
import type { DbTx } from "@/lib/database/tx";

/**
 * one booking for this consultant at a time: a transaction lock (released at commit or rollback)
 * on (INSTANT_LOCK_NS, cid), the same key instant booking and the instant payment check use, so
 * scheduled, package, program, free-session and instant bookings for one consultant are serialized
 * and each one's check sees the others' committed rows. other consultants are never blocked.
 * the caller runs its slot check and its create on the same tx, after this call; nothing slow
 * (network, google meet, notices) belongs inside that transaction
 * @param tx the booking's transaction
 * @param cid the consultant
 */
export async function lockConsultantBookings(tx: DbTx, cid: number): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${INSTANT_LOCK_NS}::int, ${cid}::int)`;
}
