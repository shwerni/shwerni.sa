// mobile/programs/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";

// data
import { getScalesForHome } from "@/data/scales";

// prisma types
import { Scale } from "@/lib/generated/prisma/client";

export const GET = createGetRoute<Scale[]>(() => getScalesForHome(), { errorMessage: "failed to fetch" });
