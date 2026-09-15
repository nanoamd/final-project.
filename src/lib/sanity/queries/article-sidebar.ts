import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";

/**
 * The links that sit down the side of a guide or journal post.
 *
 * WHY THIS EXISTS. 37 buying guides, 3 journal posts and 17 tools, and almost
 * none of them link to each other. Every one is a dead end: a reader who
 * finishes the planter guide has one route onward, the product grid at the
 * foot, and Google has none at all. Internal links are how authority moves
 * between pages and how a crawler finds the pages nobody links to — the 626
 * "discovered, not indexed" URLs are the visible shape of that gap.
 *
 * So this is the compounding part: every article published from here on gains
 * links from all its siblings, and gives links back. Forty pages linking to
 * each other is a different structure from forty pages in a list.
 *
 * WHAT COUNTS AS RELATED, in the order the sidebar shows it:
 *
 *   1. Guides sharing this one's category — the strongest signal there is, and
 *      the one a reader is most likely to want next.
 *   2. Guides that link to any of the same products. Two guides naming the
 *      same sofa are about the same decision even when their categories differ.
 *   3. Recent guides, to fill the rest. A short sidebar on a new guide is
 *      worse than one padded with genuinely recent work.
 *
 * Tools are matched in code rather than here, because which calculator belongs
 * beside which guide is a judgement about content, not a query.
 */
export interface SidebarLink {
  title: string;
  href: string;
}

export interface ArticleSidebarData {
  sameCategory: SidebarLink[];
  relatedGuides: SidebarLink[];
  journal: SidebarLink[];
}

const SIDEBAR_QUERY = /* groq */ `{
  "sameCategory": *[
    _type == "buyingGuide" && defined(publishedAt)
    && slug.current != $slug
    && defined($categorySlug)
    && relatedCategory->slug.current == $categorySlug
  ] | order(publishedAt desc) [0...8] {
    title, "href": "/learn/" + slug.current
  },
  "byProduct": *[
    _type == "buyingGuide" && defined(publishedAt)
    && slug.current != $slug
    && count((relatedProducts[]->slug.current)[@ in $productSlugs]) > 0
  ] | order(publishedAt desc) [0...8] {
    title, "href": "/learn/" + slug.current
  },
  "recent": *[
    _type == "buyingGuide" && defined(publishedAt) && slug.current != $slug
  ] | order(publishedAt desc) [0...10] {
    title, "href": "/learn/" + slug.current
  },
  "journal": *[
    _type == "post" && defined(publishedAt) && slug.current != $slug
  ] | order(publishedAt desc) [0...6] {
    title, "href": "/journal/" + slug.current
  }
}`;

interface RawSidebar {
  sameCategory: SidebarLink[];
  byProduct: SidebarLink[];
  recent: SidebarLink[];
  journal: SidebarLink[];
}

/** First occurrence wins, so the strongest match keeps its position. */
function dedupe(
  groups: SidebarLink[][],
  exclude: Set<string>,
  limit: number,
): SidebarLink[] {
  const seen = new Set(exclude);
  const out: SidebarLink[] = [];
  for (const group of groups)
    for (const link of group) {
      if (seen.has(link.href) || out.length >= limit) continue;
      seen.add(link.href);
      out.push(link);
    }
  return out;
}

export const getArticleSidebar = cache(async function getArticleSidebar({
  slug,
  categorySlug,
  productSlugs = [],
}: {
  slug: string;
  categorySlug?: string | null;
  productSlugs?: string[];
}): Promise<ArticleSidebarData> {
  const raw = await sanityFetch<RawSidebar>(
    SIDEBAR_QUERY,
    {
      slug,
      categorySlug: categorySlug ?? null,
      // An empty array makes the `in` comparison false rather than erroring,
      // which is what a guide with no product references should get.
      productSlugs,
    },
    { sameCategory: [], byProduct: [], recent: [], journal: [] },
  );

  const sameCategory = (raw.sameCategory ?? []).slice(0, 6);
  const taken = new Set(sameCategory.map((l) => l.href));
  const relatedGuides = dedupe(
    [raw.byProduct ?? [], raw.recent ?? []],
    taken,
    6,
  );

  return {
    sameCategory,
    relatedGuides,
    journal: (raw.journal ?? []).slice(0, 4),
  };
});
