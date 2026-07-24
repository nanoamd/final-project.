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

export default function Page() {
  return <HomePage />;
}
