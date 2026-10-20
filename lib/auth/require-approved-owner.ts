// React & Next
import type { NextRequest } from "next/server";

// auth
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// utils
import { HttpError } from "@/lib/api/http-error";

// data
import { getOwnerApprovalByUser } from "@/data/consultant";

// prisma types
import { ApprovalState, UserRole } from "@/lib/generated/prisma/enums";

/**
 * the signed-in mobile user, only when their session role is OWNER
 * throws 401 without a session and 403 for any other role. use for /owner/* routes
 * that must work before approval (only GET /api/mobile/owner/status today)
 */
export async function requireMobileOwner(request: NextRequest) {
  const user = await requireMobileUser(request);

  if (user.role !== UserRole.OWNER) {
    throw new HttpError("forbidden", 403);
  }

  return user;
}

/**
 * the signed-in owner and their own consultant (cid, name), only when approved
 * throws 401 without a session, 403 for a non-owner, an owner without a consultant
 * row or one that isn't APPROVED. every /owner/* mobile route uses this, and takes
 * the consultant id from here, never from the request
 */
export async function requireApprovedOwner(request: NextRequest) {
  const user = await requireMobileOwner(request);
  const consultant = await getOwnerApprovalByUser(user.id);

  if (!consultant || consultant.approved !== ApprovalState.APPROVED) {
    throw new HttpError("forbidden", 403);
  }

  return { user, consultant: { cid: consultant.cid, name: consultant.name } };
}
