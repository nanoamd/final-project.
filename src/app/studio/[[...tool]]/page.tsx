"use client";

import dynamic from "next/dynamic";

import config from "../../../../sanity.config";

/**
 * Embedded Sanity Studio. Deliberately outside the `(site)` route group —
 * full-bleed, no storefront chrome, no Lenis (see (site)/layout.tsx).
 *
 * Loaded via a client-only dynamic import (`ssr: false`): Studio's Structure
 * Tool pulls in browser-only code (swr-based hooks) that Turbopack otherwise
 * tries to resolve under the server ("react-server") export condition when a
 * Server Component imports the config graph directly, which fails to build.
 * Keeping the whole page client-rendered sidesteps that entirely.
 */
const NextStudio = dynamic(
  () => import("next-sanity/studio").then((mod) => mod.NextStudio),
  { ssr: false },
);

export default function StudioPage() {
  return <NextStudio config={config} />;
}
