// utils
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import { sendNotification } from "@/lib/notifications/mobile/send-notification";
import { TEST_CATEGORIES } from "@/lib/notifications/mobile/test-categories";

export const POST = createGetRoute(async (request) => {
  if (process.env.NODE_ENV === "production") {
    throw new HttpError("not available", 404);
  }

  const user = await requireMobileUser(request);
  const body = await request.json().catch(() => ({}));
  const preset = TEST_CATEGORIES[body?.category] ?? TEST_CATEGORIES.INFO;

  const notification = await sendNotification({
    userId: user.id,
    type: "instant",
    title: preset.title,
    description: preset.description,
    category: preset.category,
    targetId: preset.targetId,
    redirection: preset.redirection,
    ctaLabel: preset.ctaLabel,
    actionCategory: preset.actionCategory,
  });

  return { notification };
});
