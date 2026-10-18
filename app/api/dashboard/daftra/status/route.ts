// React & Next
import { NextResponse } from "next/server";

// prisma data
import { DAFTRA_MAX_ATTEMPTS } from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

// what the dashboard's daftra reads need from this app's env (it reads the database itself): is
// daftra on, and its go-live day (the "missing invoices" lists start there). no body. on a config
// error only the env var names come back, never a value; no daftra call
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const config = getDaftraConfig();
  const ok = config.enabled && config.ok;

  return NextResponse.json({
    enabled: config.enabled,
    configOk: ok,
    ...(config.enabled && !config.ok && { missing: config.missing }),
    startDate: ok ? config.startDate : null,
    maxAttempts: DAFTRA_MAX_ATTEMPTS,
  });
}
