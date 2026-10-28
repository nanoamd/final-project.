import type { Metadata } from "next";

import { SHOP_MIRRORS_ROOM } from "@/config/site";
import { CollectionIndex } from "@/features/storefront";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "All Collections",
  description:
    "Premium outdoor living, curated for every space — saunas, cold plunges, pergolas, fire pits, furniture and more.",
  path: "/shop",
});

export default function ShopPage() {
  // SHOP_MIRRORS_ROOM, not a literal: /shop/room/<this> is the same page
  // and canonicalises here, so the two must not drift apart.
  return <CollectionIndex roomSlug={SHOP_MIRRORS_ROOM} />;
}
