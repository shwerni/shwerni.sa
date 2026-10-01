"use server";

// React & Next
import { revalidateTag } from "next/cache";

// packages
import { z } from "zod";

// prisma data
import { setOwnConsultantVisibility } from "@/docs/reference/example/data-consultant";

// lib
import { createAction, ok, fail } from "@/lib/safe-action";

// replaces the exposed ownerVisibility: role-checked, owner-scoped, rate limited
export const setVisibilityAction = createAction(
  {
    name: "consultant.visibility",
    schema: z.object({ published: z.boolean() }),
    // match your role names
    auth: ["OWNER"],
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async ({ published }, { user }) => {
    const updated = await setOwnConsultantVisibility(user.id, published);
    if (!updated) return fail("not_found");

    // public lists refresh in the background; the owner's page updates from the returned data
    revalidateTag("consultants:home", "max");

    return ok({ published });
  },
);
