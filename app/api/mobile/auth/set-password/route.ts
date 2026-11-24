// packages
import { NextResponse } from "next/server";

// utils
import prisma from "@/lib/database/db";

// lib
import { mobileAuth } from "@/lib/auth/mobile-auth";
import { hashWebsitePassword } from "@/lib/auth/password";
import { normalizePassword } from "@/utils/password";

// prisma data
import { endOtherAppSessions } from "@/data/password-change";

/**
 * called once, right after a fresh otp verification (new sign up, or an
 * existing web user's first mobile login), to set the password on both
 * better auth's own store and the legacy bcrypt column next-auth reads —
 * so one password works on web and mobile
 */
export async function POST(req: Request) {
  const session = await mobileAuth.api.getSession({ headers: req.headers });

  if (!session)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { password: typed } = await req.json();

  // saved trimmed, on both stores (utils/password.ts); the length counts without the spaces
  const password = typeof typed === "string" ? normalizePassword(typed) : typed;

  if (typeof password !== "string" || password.length < 6)
    return NextResponse.json(
      { error: "كلمة المرور قصيرة جدا" },
      { status: 400 },
    );

  // an account that already had a (website) password is changing it: other logins end below.
  // a first password (a new sign-up, an account without one) changes nothing for the sessions
  const before = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  const isChange = !!before?.password;

  // creates/updates better auth's own scrypt-hashed credential row
  await mobileAuth.api.setPassword({
    body: { newPassword: password },
    headers: req.headers,
  });

  // keeps next-auth on web working with the exact same password
  const bcryptHash = await hashWebsitePassword(password);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: bcryptHash,
      phoneVerified: new Date(),
      // the app's flag (better-auth's phoneNumberVerified) follows the website's
      mobilePhoneVerified: true,
      // a change signs out the website logins from before it (data/account-state.ts)
      ...(isChange ? { passwordChangedAt: new Date() } : {}),
    },
  });

  // and the other app sessions; this one is kept
  if (isChange) await endOtherAppSessions(session.user.id, session.session.id);

  return NextResponse.json({ success: true });
}
