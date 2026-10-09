// React & Next
import { NextRequest, NextResponse } from "next/server";

// packages
import { z } from "zod";

// prisma data
import { getPleadingAccess, getPleadingThread } from "@/data/pleading";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { clientTokenSchema } from "@/utils/pleading";

interface Params {
  params: Promise<{ plid: string }>;
}

const paramsSchema = z.object({ plid: z.coerce.number().int().positive() });

// another case looks exactly like a missing one
const notFound = () =>
  NextResponse.json({ error: "Pleading not found" }, { status: 404 });

// the case chat, polled by both sides. the client sends their link token in the
// x-pleading-token header (kept out of the url, so out of request logs); without it, the caller
// must be the case's consultant (OWNER session). the token never comes back in the response
export async function GET(req: NextRequest, { params }: Params) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return notFound();

  const { plid } = parsed.data;
  const header = req.headers.get("x-pleading-token");

  let access = null;
  if (header) {
    const token = clientTokenSchema.safeParse(header);
    if (token.success) {
      const client = await getPleadingAccess({ token: token.data });
      // the token must belong to this very case
      if (client?.pleading.plid === plid) access = client;
    }
  } else {
    const user = await userServer();
    if (user?.id && user.role === UserRole.OWNER)
      access = await getPleadingAccess({ plid, userId: user.id });
  }

  if (!access) return notFound();

  const { pleading, role } = access;

  const messages = await getPleadingThread(pleading.id);
  if (!messages)
    return NextResponse.json({ error: "Internal error" }, { status: 500 });

  return NextResponse.json({
    plid: pleading.plid,
    state: pleading.state,
    price: pleading.price,
    quotedAt: pleading.quotedAt,
    expiresAt: pleading.expiresAt,
    role,
    messages,
  });
}
