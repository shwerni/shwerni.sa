// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { setConsultantOnline, setConsultantOffline } from "@/data/online";
import { createPostRoute } from "@/lib/api/routes/route-factory";

export const POST = createPostRoute(async (request) => {
  const user = await requireMobileUser(request);
  const { online } = await request.json();

  if (online) {
    await setConsultantOnline(user.id);
  } else {
    await setConsultantOffline(user.id);
  }

  return { success: true };
});
