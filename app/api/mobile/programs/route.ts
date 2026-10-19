// mobile/programs/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";

// data
import { getProgramsForHome, type PublicProgram } from "@/data/programs";

// public card fields only (never commission)
export const GET = createGetRoute<PublicProgram[]>(() => getProgramsForHome(), { errorMessage: "failed to fetch" });