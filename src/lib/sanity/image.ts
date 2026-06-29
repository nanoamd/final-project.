import type { SanityImageSource } from "@sanity/image-url";
import imageUrlBuilder from "@sanity/image-url";

import { sanityClient } from "@/lib/sanity/client";

const builder = imageUrlBuilder(sanityClient);

/**
 * Build a URL for a Sanity image source. Chain transforms before resolving,
 * e.g. `urlForImage(img).width(800).url()`.
 */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
