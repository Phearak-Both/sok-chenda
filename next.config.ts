import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
      // The shop moved to /collections, and collections became a filter on it.
      { source: "/shop", destination: "/collections", permanent: true },
      { source: "/collections/:slug", destination: "/collections?collection=:slug", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
