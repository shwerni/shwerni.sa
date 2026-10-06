"use server";

// React & Next
import { updateTag } from "next/cache";

// prisma data
import {
  updateCenterProfile as updateCenterProfileData,
  updateCenterTheme as updateCenterThemeData,
} from "@/data/center/dashboard";
import { requireCenter } from "@/data/center/require-center";

// lib
import { createAction, fail, ok } from "@/lib/safe-action";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// schemas
import { centerProfileSchema, centerThemeSchema } from "@/schemas/center";

// constants
import { centerThemes } from "@/constants/theme/center";

// utils
import { meetsAA } from "@/utils/contrast";

// the signed-in member's center, or null (the role was already checked by createAction)
const ownCenter = async () => {
  try {
    return await requireCenter();
  } catch {
    return null;
  }
};

// center account: its own profile. the centerId comes from requireCenter() only
export const saveCenterProfile = createAction(
  {
    name: "center.profile",
    schema: centerProfileSchema,
    auth: [UserRole.CENTER] as const,
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async (input) => {
    const ctx = await ownCenter();
    if (!ctx) return fail("forbidden");

    await updateCenterProfileData(ctx.centerId, input);

    // the center's public pages and the directory card (name, logo, city)
    updateTag(`center:${ctx.centerId}`);
    updateTag("centers");

    return ok(null);
  },
);

// center account: its theme (one of the curated themes + optional hex overrides, AA checked)
export const saveCenterTheme = createAction(
  {
    name: "center.theme",
    schema: centerThemeSchema,
    auth: [UserRole.CENTER] as const,
    rateLimit: [{ by: "user", limit: 20, window: "1 m" }],
  },
  async ({ themeKey, themeVars }) => {
    const ctx = await ownCenter();
    if (!ctx) return fail("forbidden");

    // only the overrides actually set; the check runs on the colors the page will use
    const overrides = Object.fromEntries(
      Object.entries(themeVars ?? {}).filter(([, v]) => !!v),
    ) as Record<string, string>;
    const colors = { ...centerThemes[themeKey], ...overrides };

    if (!meetsAA(colors.primary, colors.primaryForeground))
      return fail("contrast_primary");
    if (
      !meetsAA(colors.secondary, colors.secondarySoft) ||
      !meetsAA(colors.secondary, "#ffffff")
    )
      return fail("contrast_secondary");

    await updateCenterThemeData(
      ctx.centerId,
      themeKey,
      Object.keys(overrides).length ? overrides : null,
    );

    updateTag(`center:${ctx.centerId}`);

    return ok({ themeKey });
  },
);
