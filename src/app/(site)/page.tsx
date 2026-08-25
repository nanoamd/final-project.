import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { HomePage } from "@/features/storefront";

// Deliberately minimal — title, description, OpenGraph and Twitter all
// already come from the root layout's defaults and are correct for the
// homepage as-is. Adding a full metadata object here would REPLACE those
// nested objects wholesale (Next doesn't deep-merge parent/child metadata),
// so this only adds the one thing genuinely missing: a canonical URL.
export const metadata: Metadata = {
  alternates: { canonical: siteConfig.url },
};

// Every other content page sets this 60s floor; the homepage was the one
// page relying purely on on-demand webhook revalidation, so a missed/failed
// webhook could leave it stale indefinitely.
export const revalidate = 1800;

export default function Page() {
  return <HomePage />;
}
