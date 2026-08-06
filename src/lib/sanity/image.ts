import type { SanityImageSource } from "@sanity/image-url";
// The named export, not the default: the default is deprecated and logs
// "The default export of @sanity/image-url has been deprecated. Use the named
// export `createImageUrlBuilder` instead." on every build.
import { createImageUrlBuilder } from "@sanity/image-url";

import { sanityClient } from "@/lib/sanity/client";

const builder = createImageUrlBuilder(sanityClient);

/**
 * Build a URL for a Sanity image source. Chain transforms before resolving,
 * e.g. `urlForImage(img).width(800).url()`.
 */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
