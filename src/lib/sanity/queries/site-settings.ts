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

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return sanityFetch<SanitySiteSettings | null>(SITE_SETTINGS_QUERY, {}, null);
}

export async function getSeoDefaults(): Promise<SanitySeoDefaults | null> {
  return sanityFetch<SanitySeoDefaults | null>(SEO_DEFAULTS_QUERY, {}, null);
}
