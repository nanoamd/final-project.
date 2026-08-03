import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import type {
  SanitySeoDefaults,
  SanitySiteSettings,
} from "@/types/sanity-content";

const SITE_SETTINGS_QUERY = /* groq */ `
*[_type == "siteSettings"][0] {
  siteName,
  legalName,
  tagline,
  description,
  "logo": logo.asset->url,
  email,
  phone
}`;

const SEO_DEFAULTS_QUERY = /* groq */ `
*[_type == "seoDefaults"][0] {
  defaultMetaTitleTemplate,
  defaultMetaDescription,
  "defaultOgImage": defaultOgImage.asset->url
}`;

// Cached per-request (React's `cache()`, not a time-based cache) — the
// root layout fetches this for header/footer, and several pages (e.g.
// /contact) fetch it again for their own metadata; without this every such
// request fired the same Sanity query twice.
export const getSiteSettings = cache(
  async function getSiteSettings(): Promise<SanitySiteSettings | null> {
    return sanityFetch<SanitySiteSettings | null>(
      SITE_SETTINGS_QUERY,
      {},
      null,
    );
  },
);

export async function getSeoDefaults(): Promise<SanitySeoDefaults | null> {
  return sanityFetch<SanitySeoDefaults | null>(SEO_DEFAULTS_QUERY, {}, null);
}
