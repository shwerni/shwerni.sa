import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// packages
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { withBotId } from "botid/next/config";

// routes
import { DynamicpublicRoutes } from "./routes";

// botid hardcodes its challenge prefix and doesn't export it. routes.ts lists it as public so
// guests reach the challenge; if a botid upgrade changes it, proxy.ts would send every guest's
// challenge to /login. runs on every `next build`, local and vercel, whatever the build command
function checkBotIdPrefix() {
  const uuid = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const prefix = DynamicpublicRoutes.find((route) => uuid.test(route));
  const dist = path.join(process.cwd(), "node_modules", "botid", "dist");

  const found =
    !!prefix &&
    readdirSync(dist, { recursive: true, encoding: "utf8" })
      .filter((file) => /\.(m?js)$/.test(file))
      .some((file) =>
        readFileSync(path.join(dist, file), "utf8").includes(`"${prefix}/`),
      );

  if (!found)
    throw new Error(
      `[botid] the challenge prefix ${prefix ?? "(missing)"} in routes.ts (DynamicpublicRoutes) ` +
        "was not found in node_modules/botid: the prefix changed, routes.ts must be updated. " +
        "find the new one with: grep -oE '\"/[0-9a-f-]{36}/[0-9a-f-]{36}[^\"]*\"' " +
        "node_modules/botid/dist/next/config/index.mjs",
    );
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/available", destination: "/discover", permanent: true },
      { source: "/privacy", destination: "/terms", permanent: true },

      // old/bot-generated url — redirect at the edge so it never renders a page
      { source: "/index", destination: "/", permanent: true },

      // singular → plural
      { source: "/freesession", destination: "/freesessions", permanent: true },
      {
        source: "/freesession/:path*",
        destination: "/freesessions/:path*",
        permanent: true,
      },
      {
        source: "/meeting/:path*",
        destination: "/meetings/:path*",
        permanent: true,
      },
      { source: "/consultant", destination: "/consultants", permanent: true },
      {
        source: "/consultant/:path*",
        destination: "/consultants/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    // no inlineCss: next 16 embeds the stylesheet twice (a <style> and the rsc payload), +30 KB
    // brotli per page for no lighthouse gain. no optimizeCss either: critters only works in the
    // pages router
    // viewTransition: true,
    useLightningcss: true,
  },
  // reactCompiler: true,
  compiler: {
    //removeConsole: {
    //  exclude: ["error", "warn"],
    // },
  },
  cacheComponents: true,
  compress: true,
  images: {
    qualities: [75, 100],
    // deviceSizes: [640, 750, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // uploadthing,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "huqzhdqiy3.ufs.sh", // uploadthing,
        pathname: "/**",
      },
    ],
  },
};

// botid: proxies its challenge script through this domain
export default withBotId((phase: string) => {
  // builds only: dev and start load this config too
  if (phase === PHASE_PRODUCTION_BUILD) checkBotIdPrefix();
  return nextConfig;
});
