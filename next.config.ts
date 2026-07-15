import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response.
 *
 * A Content-Security-Policy is intentionally omitted here: a strict CSP needs
 * per-request nonces and app-specific tuning, and is best added as its own step
 * once there are real pages to test against.
 */
const securityHeaders = [
  // Disallow MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Mitigate clickjacking; allow same-origin framing only.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Send the origin (not the full path) on cross-origin requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow the browser to prefetch DNS for outbound links.
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Enforce HTTPS for two years. Honoured by browsers only over HTTPS, so it is
  // a no-op on http://localhost. `preload` is omitted to avoid the
  // irreversible preload-list commitment.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Deny powerful features by default; opt in per-feature when needed.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Surfaces unsafe effects/lifecycle issues during development.
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Statically type <Link href> and router calls; broken internal links fail the build.
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
