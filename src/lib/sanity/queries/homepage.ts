import { sanityFetch } from "@/lib/sanity/fetch";
import { LINK_PROJECTION } from "@/lib/sanity/queries/fragments";
import type { SanityHomepage } from "@/types/sanity-content";

const HOMEPAGE_QUERY = /* groq */ `
*[_type == "homepage"][0] {
  heroEyebrow,
  heroHeadline,
  heroHighlight,
  heroSubcopy,
  "heroImage": heroImage.asset->url,
  "heroCtaPrimary": heroCtaPrimary ${LINK_PROJECTION},
  "heroCtaSecondary": heroCtaSecondary ${LINK_PROJECTION},
  "heroFeaturedProductSlug": heroFeaturedProduct->slug.current,
  "trustBarItems": trustBarItems[]{ iconName, title, copy },
  shopByCategoryEyebrow,
  "shopByCategoryTiles": shopByCategoryTiles[]{
    "categorySlug": category->slug.current,
    "categoryName": category->title,
    "image": coalesce(imageOverride.asset->url, category->heroImage.asset->url)
  },
  gardenStudioEyebrow,
  gardenStudioHeadline,
  gardenStudioBody,
  "gardenStudioImages": gardenStudioImages[].asset->url,
  "gardenStudioCta": gardenStudioCta ${LINK_PROJECTION},
  designedForLivingHeadline,
  "designedForLivingCards": designedForLivingCards[]{
    title,
    copy,
    "image": image.asset->url
  }
}`;

export async function getHomepage(): Promise<SanityHomepage | null> {
  return sanityFetch<SanityHomepage | null>(HOMEPAGE_QUERY, {}, null);
}
