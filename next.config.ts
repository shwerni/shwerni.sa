import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    // viewTransition: true,
    useLightningcss: true,
    optimizePackageImports: ["lucide-react", "date-fns", "lodash"],
  },
  reactCompiler: true,
  cacheComponents: true,
  compress: true,
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  images: {
    qualities: [75, 100],
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

export default nextConfig;
