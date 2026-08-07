import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

const DEFAULT_OG_IMAGE = `${siteConfig.url}/images/garden-after.jpg`;

interface BuildMetadataInput {
  /** Plain page title — passed through the root layout's `%s — Kaiku`
   * template for `<title>`, but used in full (with the suffix) for
   * OpenGraph/Twitter since those aren't templated automatically. */
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/shop/outdoor-saunas" or "/". */
  path: string;
  image?: string;
  noindex?: boolean;
}

/**
 * Builds a complete per-page Metadata object — canonical URL, OpenGraph and
 * Twitter Card — so every route gets the same treatment instead of the
 * ad-hoc {title, description}-only objects each page used to hand-roll.
 * Next.js metadata resolution replaces (not merges) a nested key like
 * `openGraph` wholesale when a page defines it, so pages using this helper
 * should use the full object it returns rather than spreading over it.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noindex,
}: BuildMetadataInput): Metadata {
  const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  /**
   * Most product titles already end in the brand ("… | Kaiku") — 37 of 39 at
   * the time of writing — and the root layout's `%s — Kaiku` template appended
   * it a second time, so search results read "… | Kaiku — Kaiku". That wastes
   * roughly eight of the ~60 characters Google renders and reads as a mistake
   * on the one line a searcher judges the shop by.
   *
   * `title.absolute` opts the page out of the template rather than editing any
   * product name. Titles that don't already carry the brand still get the
   * suffix, so nothing loses it.
   */
  const alreadyBranded = new RegExp(`${siteConfig.name}\\s*$`, "i").test(title);
  const fullTitle = alreadyBranded ? title : `${title} — ${siteConfig.name}`;

  return {
    title: alreadyBranded ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
