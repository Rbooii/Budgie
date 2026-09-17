import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (PPR): static shell served instantly, dynamic data streams
  // in behind <Suspense>. Replaces the old `dynamic = "force-dynamic"` exports.
  cacheComponents: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Strip stray console.* from the client bundle in production, keep errors.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    // Smaller client bundles: only the icons actually imported.
    optimizePackageImports: ["lucide-react", "react-icons"],
  },
};

export default nextConfig;
