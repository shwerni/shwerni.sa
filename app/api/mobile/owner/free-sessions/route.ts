// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute, createPatchRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { toggleFreesessionState } from "@/data/freesession";
import {
  getOwnerFreeSessions,
  type OwnerFreeSessions,
} from "@/data/mobile/owner-free-sessions";

const SwitchSchema = z.object({ enabled: z.boolean() });

interface OwnerFreeSessionsSwitch {
  enabled: boolean;
}

// the approved owner's weekly free-session switch and their upcoming free sessions
export const GET = createGetRoute<OwnerFreeSessions>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return getOwnerFreeSessions(consultant.cid);
  },
  { errorMessage: "failed to fetch" },
);

// turn this week's free sessions on or off with the website's switch (it sets this week's saturday)
export const PATCH = createPatchRoute<OwnerFreeSessionsSwitch>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = SwitchSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const { enabled } = parsed.data;

    if (!(await toggleFreesessionState(consultant.cid, enabled))) {
      throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);
    }

    return { enabled };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
