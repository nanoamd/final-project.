import type { Metadata } from "next";

import { CollectionIndex } from "@/features/storefront";

export const metadata: Metadata = {
  title: "All Collections",
  description:
    "Premium outdoor living, curated for every space — saunas, cold plunges, pergolas, fire pits, furniture and more.",
};

export default function ShopPage() {
  return <CollectionIndex roomSlug="outdoor-living" />;
}
