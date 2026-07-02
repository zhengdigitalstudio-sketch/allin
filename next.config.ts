import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      // Article detail with slug: /artikel/energi-terbarukan → /
      {
        source: "/artikel/:slug",
        destination: "/",
      },
      // All other public & dashboard SPA routes → /
      {
        source: "/:path((?!api|_next|uploads|robots\\.txt|sitemap\\.xml|favicon\\.ico|icon-.*\\.png|apple-touch-icon.*\\.png|manifest\\.json).*)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;