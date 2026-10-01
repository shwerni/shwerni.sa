// mobile/programs/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";

// data
import { getProgramsForHome } from "@/data/programs";

// prisma types
import { Program } from "@/lib/generated/prisma/client";

export const GET = createGetRoute<Program[]>(() => getProgramsForHome(), { errorMessage: "failed to fetch" });