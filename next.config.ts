import type { NextConfig } from "next";

// CSP is relaxed in development so Next's HMR (eval + websocket) keeps working.
const isDev = process.env.NODE_ENV !== "production";

// Security response headers applied to every route (see headers() below).
// CSP intentionally allows 'unsafe-inline' for scripts (Next injects inline
// hydration/runtime scripts; no nonce wiring) and styles (Tailwind + inline
// styles used throughout this app). Tighten to a nonce-based policy later if
// stricter XSS protection is required.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "mariadb", "sharp"],
  experimental: {
    serverActions: {
      // Lowered from 25mb. Raw uploads are converted to webp server-side; per-file
      // size/type validation is also enforced in src/lib/upload/storage.ts. Tunable.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // All rendered image srcs are site-relative (/uploads/...) — see safeImageSrc
    // and isRenderablePromoBannerImageUrl, both of which reject non-local URLs.
    // No remote hosts are needed, so the previous `https://**` wildcard (an
    // image-optimizer open-proxy / SSRF surface) is removed. Localhost kept for dev.
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
