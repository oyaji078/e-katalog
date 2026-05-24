import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "mariadb"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    // Product image URLs are admin-supplied (validated to http/https on save).
    // The optimizer is allowed to fetch from any host so the catalog can use
    // arbitrary CDN/supplier URLs; protocol is restricted to http/https.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
