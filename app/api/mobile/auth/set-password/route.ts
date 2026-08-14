// packages
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// utils
import prisma from "@/lib/database/db";

// lib
import { mobileAuth } from "@/lib/auth/mobile-auth";

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

  const { password } = await req.json();

  if (typeof password !== "string" || password.length < 6)
    return NextResponse.json(
      { error: "كلمة المرور قصيرة جدا" },
      { status: 400 },
    );

  // creates/updates better auth's own scrypt-hashed credential row
  await mobileAuth.api.setPassword({
    body: { newPassword: password },
    headers: req.headers,
  });

  // keeps next-auth on web working with the exact same password
  const bcryptHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: bcryptHash,
      phoneVerified: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
