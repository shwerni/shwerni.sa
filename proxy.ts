import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  DynamicpublicRoutes,
} from "@/routes";

// 🎉 EVENT MODE — client site restricted to the allowlist below
const EVENT_ALLOWED_EXACT = ["/", "/contact-us", "/terms", "/event"];
const EVENT_ALLOWED_PREFIXES = ["/event/", "/freesessions/"];

// strip trailing slash so "/event/" and "/terms/" match the exact list
const normalize = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

function isEventAllowed(pathname: string) {
  if (EVENT_ALLOWED_EXACT.includes(pathname)) return true;
  return EVENT_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = normalize(nextUrl.pathname);
  const eventMode = true;

  // 🛡️ MOBILE API GUARD
  if (pathname.startsWith("/api/mobile")) {
    const appSecret = req.headers.get("x-app-secret");

    if (!appSecret || appSecret !== process.env.APP_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid App Secret" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // 🔁 singular typo links (/freesession/xyz) → real meeting page (/freesessions/xyz)
  if (pathname.startsWith("/freesession/")) {
    const url = nextUrl.clone();
    url.pathname = pathname.replace("/freesession/", "/freesessions/");
    return NextResponse.redirect(url);
  }

  // 🎉 EVENT MODE GATE — before every other rule
  if (eventMode) {
    const isExempt =
      pathname.startsWith("/api") ||
      pathname.startsWith("/dashboard") ||
      authRoutes.includes(pathname);

    if (!isExempt) {
      // allowed event pages are public — no token check
      if (isEventAllowed(pathname)) {
        const res = NextResponse.next();
        res.headers.set("x-event-mode", "on");
        return res;
      }

      const res = NextResponse.redirect(new URL("/", nextUrl));
      res.headers.set("x-event-mode", "blocked");
      return res;
    }
  }

  // ✅ 1. always allow auth API
  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

  // ✅ 2. deprecated redirect (unreachable in event mode — gate above already sends it to "/")
  if (pathname === "/available")
    return NextResponse.redirect(new URL("/discover", nextUrl));

  // ✅ 3. public routes
  if (
    publicRoutes.includes(pathname) ||
    DynamicpublicRoutes.some((r) => pathname.startsWith(r))
  ) {
    const res = NextResponse.next();
    res.headers.set("x-event-mode", eventMode ? "on" : "off");
    return res;
  }

  // ✅ 4. token check only for auth + protected routes
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLoggedIn = !!token;
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|mp4|mp3|pdf|css|js)$).*)",
  ],
};
// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import {
//   authRoutes,
//   publicRoutes,
//   apiAuthPrefix,
//   DynamicpublicRoutes,
// } from "@/routes";

// export async function proxy(req: NextRequest) {
//   const { nextUrl } = req;
//   const pathname = nextUrl.pathname;

//   // 🛡️ MOBILE API GUARD
//   if (pathname.startsWith("/api/mobile")) {
//     const appSecret = req.headers.get("x-app-secret");

//     // app secret is required for mobile API requests, and must match the server's configured secret
//     if (!appSecret || appSecret !== process.env.APP_SECRET) {
//       return NextResponse.json(
//         { error: "Unauthorized: Invalid App Secret" },
//         { status: 401 },
//       );
//     }
//     return NextResponse.next();
//   }

//   // ✅ 1. always allow auth API — no token check needed
//   if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

//   // ✅ 2. deprecated redirect — no token check needed
//   if (pathname === "/available")
//     return NextResponse.redirect(new URL("/discover", nextUrl));

//   // ✅ 3. public routes — skip entirely, no token check
//   if (
//     publicRoutes.includes(pathname) ||
//     DynamicpublicRoutes.some((r) => pathname.startsWith(r))
//   )
//     return NextResponse.next();

//   // ✅ 4. only verify token when actually needed (auth + protected routes)
//   const token = await getToken({
//     req,
//     secret: process.env.AUTH_SECRET,
//     // if you use __Secure- prefix in prod:
//     secureCookie: process.env.NODE_ENV === "production",
//   });

//   const isLoggedIn = !!token;
//   const isAuthRoute = authRoutes.includes(pathname);

//   if (isAuthRoute) {
//     if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
//     return NextResponse.next();
//   }

//   // protected route — not logged in
//   if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths EXCEPT:
//      * - _next/static  (Next.js static files)
//      * - _next/image   (Next.js image optimization)
//      * - _vercel       (Vercel internals)
//      * - Static file extensions (images, fonts, docs, media)
//      * - favicon & SEO files
//      */
//     "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|mp4|mp3|pdf|css|js)$).*)",
//   ],
// };
