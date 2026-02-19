// auth
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// routes
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  DynamicpublicRoutes,
} from "@/routes";

// next auth
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // request url
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // is auth API routes ex: "/api/auht/providers"
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  // is auth routes ex: "/auh/login"
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  // is Public routes ex: "/" - home
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  // is dynamic Public routes ex: "/consultant/1"
  const isDynamicPublicRoute = DynamicpublicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // auth logic
  // auth API route always allow ex: "/api/auth"
  if (isApiAuthRoute) return;

  // is public route
  if (isPublicRoute || isDynamicPublicRoute) return;

  // auth route ex: "/auh/login"
  if (isAuthRoute) {
    // if logged redirect to default redirected route after logged in
    if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
    // if not logged in redirect to the auth route normally
    return;
  }

  // if is not logged or is not public route allow all
  if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));

  return;
});

export const config = {
  // could be replaced by every private route I want
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
