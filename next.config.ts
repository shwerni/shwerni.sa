import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    // viewTransition: true,
    // optimizePackageImports: ["lucide-react", "date-fns", "lodash"],
    useLightningcss: true,
  },
  // reactCompiler: true,
  // compiler: {
  //   removeConsole: {
  //     exclude: ["error", "warn"],
  //   },
  // },
  cacheComponents: true,
  compress: true,
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
