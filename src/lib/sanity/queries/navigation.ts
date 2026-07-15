import { sanityFetch } from "@/lib/sanity/fetch";
import { LINK_PROJECTION } from "@/lib/sanity/queries/fragments";
import type { SanityNavigation } from "@/types/sanity-content";

const NAVIGATION_QUERY = /* groq */ `
*[_type == "navigation"][0] {
  "headerLinks": headerLinks[]{
    ...link ${LINK_PROJECTION},
    "children": children[] ${LINK_PROJECTION}
  },
  "collectionsBarLinks": collectionsBarLinks[] ${LINK_PROJECTION},
  "footerColumns": footerColumns[]{
    title,
    "links": links[] ${LINK_PROJECTION}
  }
}`;

export async function getNavigation(): Promise<SanityNavigation | null> {
  return sanityFetch<SanityNavigation | null>(NAVIGATION_QUERY, {}, null);
}
