// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { getScalesForList, type PublicScale } from "@/data/scales";

// every published, public, active scale card for the app's list (GET scales stays the home carousel)
export const GET = createGetRoute<PublicScale[]>(async (request) => {
  await requireMobileUser(request);
  return getScalesForList();
});
