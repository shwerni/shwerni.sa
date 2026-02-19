import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    qualities: [75, 100],
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
