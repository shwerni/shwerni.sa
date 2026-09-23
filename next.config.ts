import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/available", destination: "/discover", permanent: true },
      { source: "/privacy", destination: "/terms", permanent: true },

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
    optimizeCss: true,
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

export default nextConfig;
