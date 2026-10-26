import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Browsers ignore this over plain http, so it only takes effect on the live https site.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  experimental: {
    // Photos are uploaded one at a time; this leaves room for large phone photos.
    serverActions: { bodySizeLimit: "16mb" },
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // The shop moved to /collections; the old per-collection pages no longer exist.
      { source: "/shop", destination: "/collections", permanent: true },
      { source: "/collections/:slug", destination: "/collections", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // No other site may frame these pages…
      {
        source: "/:path((?!telegram/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      // …except the Telegram price form, which Telegram's web version shows in a frame.
      {
        source: "/telegram/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self' https://web.telegram.org" }],
      },
    ];
  },
};

export default nextConfig;
