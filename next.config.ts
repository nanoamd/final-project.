import type { NextConfig } from "next";

import {
  RENAMED_PRODUCT_URLS,
  RETIRED_PRODUCT_URLS,
} from "./src/lib/seo/retired-urls";

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
    /**
     * Resize through Sanity's CDN, not Vercel's optimiser.
     *
     * Every product image on the live site stopped rendering, and the cause was
     * `/_next/image?url=…` answering **HTTP 402 Payment Required** — Vercel had cut
     * off image optimisation because the account hit its transformation allowance.
     * Already-cached images kept working, so the symptom read as "the new products
     * have no pictures": a new product is the only thing needing a transformation
     * Vercel had not already done.
     *
     * Sanity's CDN does the same job from the same URL, and this codebase already
     * builds `?w=&h=&fit=&auto=format` URLs for cards and the feed. The old pipeline
     * asked Sanity for a 1000px JPEG and then paid Vercel to make it a 640px WebP —
     * two paid transformations for one job, and the second is the one that ran out.
     *
     * `remotePatterns` stays for the dev server and for anything that reads it, but
     * with a custom loader the allowlist is no longer what gates fetching; the loader
     * passes non-Sanity sources through untouched.
     */
    loader: "custom",
    loaderFile: "./src/lib/sanity/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  experimental: {
    serverActions: {
      // The garden visualiser server action receives an uploaded photo as a
      // base64 data URL — up to ~8MB raw, which is ~11MB once base64-encoded.
      // Default limit is 1MB.
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * Permanently retired product URLs, sent to the category they belonged to, and
   * repaired slugs, sent to the same product's new address.
   *
   * These are declared here rather than checked at request time so they cost
   * nothing per page view: a redirect in the config is matched before any
   * rendering happens. See src/lib/seo/retired-urls.ts for why a redirect and not
   * a 404.
   */
  async redirects() {
    return [...RETIRED_PRODUCT_URLS, ...RENAMED_PRODUCT_URLS].map(
      ({ from, to }) => ({
        source: from,
        destination: to,
        permanent: true,
      }),
    );
  },
};

export default nextConfig;
