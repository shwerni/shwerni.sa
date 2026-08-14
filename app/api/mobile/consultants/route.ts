// mobile/consultants/route.ts

// packages
import { createGetRoute } from "@/lib/api/routes/create-get-route";

// data
import { getPuslishedConsultantsForHome } from "@/data/consultant";

// types
import { ConsultantCard } from "@/types/layout";

export const GET = createGetRoute<ConsultantCard[]>(() => getPuslishedConsultantsForHome());