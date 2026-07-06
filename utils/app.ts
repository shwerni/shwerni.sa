import { NextResponse } from "next/server";

/**
 * Drop-in guard to ensure the request is coming from your mobile app.
 * Usage in Next.js route:
 *   const isApp = requireAppSecret(req);
 *   if (isApp instanceof Response) return isApp; // 401 Unauthorized
 */
export async function requireAppSecret(req: Request) {
  const appSecret = req.headers.get("x-app-secret");

  // Compare the header from the mobile app to your Next.js .env variable
  if (!appSecret || appSecret !== process.env.APP_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid App Secret" },
      { status: 401 }
    );
  }

  return null;
}