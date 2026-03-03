import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  cacheComponents: true,
  compress: true,
  images: {
    qualities: [75, 100],
    formats: ["image/avif", "image/webp"],
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
