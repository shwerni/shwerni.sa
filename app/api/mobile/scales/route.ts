// mobile/scales/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";

// data
import { getScalesForHome, type PublicScale } from "@/data/scales";

// public, active scale cards only
export const GET = createGetRoute<PublicScale[]>(() => getScalesForHome(), { errorMessage: "failed to fetch" });
