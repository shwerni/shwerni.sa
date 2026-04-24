import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  DynamicpublicRoutes,
} from "@/routes";

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // ✅ 1. always allow auth API — no token check needed
  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

  // ✅ 2. deprecated redirect — no token check needed
  if (pathname === "/available")
    return NextResponse.redirect(new URL("/discover", nextUrl));

  // ✅ 3. public routes — skip entirely, no token check
  if (
    publicRoutes.includes(pathname) ||
    DynamicpublicRoutes.some((r) => pathname.startsWith(r))
  )
    return NextResponse.next();

  // ✅ 4. only verify token when actually needed (auth + protected routes)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // if you use __Secure- prefix in prod:
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLoggedIn = !!token;
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }

  // protected route — not logged in
  if (!isLoggedIn)
    return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static files)
     * - _next/image   (Next.js image optimization)
     * - _vercel       (Vercel internals)
     * - Static file extensions (images, fonts, docs, media)
     * - favicon & SEO files
     */
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|mp4|mp3|pdf|css|js)$).*)",
  ],
};