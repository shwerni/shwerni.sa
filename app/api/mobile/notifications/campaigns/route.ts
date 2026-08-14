// React & Next
import { NextResponse } from "next/server";

// auth
import { roleServer } from "@/lib/auth/server";

// utils
import { sendCampaign } from "@/lib/notifications/send-campaign";

// dashboard roles allowed to blast a mass notification
const ALLOWED_ROLES = ["ADMIN"];

export async function POST(request: Request) {
  const role = await roleServer();

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const campaign = await sendCampaign({
      type: body.type,
      title: body.title,
      description: body.description,
      audience: body.audience,
      redirection: body.redirection ?? null,
      ctaLabel: body.ctaLabel ?? null,
      timeToSend: body.timeToSend ? new Date(body.timeToSend) : undefined,
      actionCategory: body.actionCategory,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to send campaign",
      },
      { status: 400 },
    );
  }
}
