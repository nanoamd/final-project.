import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Surfaces unsafe effects/lifecycle issues during development.
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Statically type <Link href> and router calls; broken internal links fail the build.
  typedRoutes: true,
};

export default nextConfig;
