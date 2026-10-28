// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPatchRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// handlers
import { ownerVisibility } from "@/handlers/conusltant/owner/profile";

const VisibilitySchema = z.object({ visible: z.boolean() });

interface OwnerVisibilityResponse {
  visible: boolean;
}

// the consultant's own show / hide switch (Consultant.status), through the website's handler.
// approved owners only; the row is the session user's own, never one from the request
export const PATCH = createPatchRoute<OwnerVisibilityResponse>(
  async (request: NextRequest) => {
    const { user } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = VisibilitySchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const { visible } = parsed.data;

    const result = await ownerVisibility(user.id, visible);
    if (!result.state) throw new Error(result.message);

    return { visible };
  },
  { errorMessage: "failed to save" },
);
