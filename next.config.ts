import type { NextConfig } from "next";
import nextTranslate from "next-translate-plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Legacy email links used the API path on the frontend host.
  async redirects() {
    return [
      {
        source: "/api/v1/auth/verify-email/:token*",
        destination: "/verify-email/:token*",
        permanent: false,
      },
      {
        source: "/api/v1/auth/reset-password/:token*",
        destination: "/reset-password/:token*",
        permanent: false,
      },
    ];
  },
};

const isTurbopack = !process.argv.includes("--webpack");

export default nextTranslate(nextConfig, { turbopack: isTurbopack });
