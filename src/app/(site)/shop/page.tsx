import type { Metadata } from "next";

import { CollectionIndex } from "@/features/storefront";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "All Collections",
  description:
    "Premium outdoor living, curated for every space — saunas, cold plunges, pergolas, fire pits, furniture and more.",
  path: "/shop",
});

export default function ShopPage() {
  return <CollectionIndex roomSlug="outdoor-living" />;
}
