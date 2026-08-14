// mobile/programs/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/create-get-route";

// data
import { getScalesForHome } from "@/data/scales";

// prisma types
import { Scale } from "@/lib/generated/prisma/client";

export const GET = createGetRoute<Scale[]>(() => getScalesForHome());
