import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  authRoutes,
  publicRoutes,
  protectedPrefixes,
  apiAuthPrefix,
  DynamicpublicRoutes,
} from "@/routes";
import { publicDetailExists, type PublicDetail } from "@/data/seo";

// query values that mean "no value" (old redirects built ?collaboration=undefined)
const EMPTY_PARAM = new Set(["", "undefined", "null"]);

// public detail pages: a missing or hidden one answers a real 404 from here. the page's own
// notFound() still runs, but once the prerendered shell has streamed it can only add noindex
// to a 200 (a soft 404)
const DETAIL_ROUTES: { pattern: RegExp; kind: PublicDetail; numeric: boolean }[] = [
  { pattern: /^\/articles\/([^/]+)\/?$/, kind: "article", numeric: true },
  { pattern: /^\/consultants\/([^/]+)\/?$/, kind: "consultant", numeric: true },
  { pattern: /^\/programs\/([^/]+)\/?$/, kind: "program", numeric: true },
  { pattern: /^\/scales\/([^/]+)\/?$/, kind: "scale", numeric: false },
];

// per-instance cache of the existence checks: found for 5 minutes, missing for 1 minute (a
// newly published page answers within a minute)
const FOUND_TTL = 5 * 60_000;
const MISSING_TTL = 60_000;
const existsCache = new Map<string, { exists: boolean; at: number }>();

async function detailExists(kind: PublicDetail, key: string) {
  const cacheKey = `${kind}:${key}`;
  const hit = existsCache.get(cacheKey);
  if (hit && Date.now() - hit.at < (hit.exists ? FOUND_TTL : MISSING_TTL))
    return hit.exists;

  let exists: boolean;
  try {
    exists = await publicDetailExists(kind, key);
  } catch (error) {
    // a database error never turns a real page into a 404: the page decides
    console.error(`[proxy] existence check failed (${cacheKey})`, error);
    return true;
  }

  if (existsCache.size > 5000) existsCache.clear();
  existsCache.set(cacheKey, { exists, at: Date.now() });
  return exists;
}

// the missing detail page, or null when the path isn't one (or the page exists)
async function missingDetail(pathname: string) {
  for (const { pattern, kind, numeric } of DETAIL_ROUTES) {
    const match = pattern.exec(pathname);
    if (!match) continue;

    // a malformed escape (e.g. "%E0") can't match a row either
    let key: string;
    try {
      key = decodeURIComponent(match[1]);
    } catch {
      return true;
    }
    // the pages parse ids with Number(): anything but a positive int4 can never match a row
    if (numeric && !(/^\d{1,10}$/.test(key) && Number(key) <= 2147483647)) return true;

    return !(await detailExists(kind, key));
  }
  return false;
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 🛡️ MOBILE API GUARD
  if (pathname.startsWith("/api/mobile")) {
    const appSecret = req.headers.get("x-app-secret");

    // app secret is required for mobile API requests, and must match the server's configured secret
    if (!appSecret || appSecret !== process.env.APP_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid App Secret" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // ✅ 1. always allow auth API — no token check needed
  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

  // 🔗 a collaboration param without a real id: 301 to the same url without it
  const collaboration = nextUrl.searchParams.get("collaboration");
  if (collaboration !== null && EMPTY_PARAM.has(collaboration.trim())) {
    const url = nextUrl.clone();
    url.searchParams.delete("collaboration");
    return NextResponse.redirect(url, 301);
  }

  // 🚫 a missing or hidden article, consultant, program or scale: a real 404 (an unmatched
  // path renders app/not-found.tsx with status 404)
  if (await missingDetail(pathname))
    return NextResponse.rewrite(new URL("/404-not-found", nextUrl));

  // ✅ 2. public routes — skip entirely, no token check
  // (deprecated URL redirects live in next.config.ts → redirects())
  if (
    publicRoutes.includes(pathname) ||
    DynamicpublicRoutes.some((r) => pathname.startsWith(r))
  )
    return NextResponse.next();

  // ✅ 3. neither an auth route nor a private path: next answers (unknown urls get a 404)
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isAuthRoute && !isProtected) return NextResponse.next();

  // ✅ 4. only verify token when actually needed (auth + protected routes)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // if you use __Secure- prefix in prod:
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLoggedIn = !!token;

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }

  // protected route — not logged in
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

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
     * - favicon & SEO files (the sitemap index, the per-type sitemaps under /sitemaps/, robots.txt)
     */
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|sitemaps/|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|mp4|mp3|pdf|css|js)$).*)",
  ],
};
