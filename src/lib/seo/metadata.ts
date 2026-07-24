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
  const fullTitle = `${title} — ${siteConfig.name}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
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
