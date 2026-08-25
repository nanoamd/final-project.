/**
 * Next.js image loader that resizes through Sanity's CDN instead of Vercel's
 * optimiser.
 *
 * **Why this exists.** Every product image on the live site stopped rendering, and
 * the cause was not the images: `/_next/image?url=…` was answering **HTTP 402
 * Payment Required**. Vercel had cut off image optimisation because the account hit
 * its transformation allowance. Anything already cached kept working, so the symptom
 * was precisely "the new products have no pictures" — a new product is the only thing
 * that needs a transformation Vercel has not already done and cached.
 *
 * It should never have been Vercel's job. Sanity's CDN resizes, crops and converts
 * format on demand from the same URL — `?w=800&h=1000&fit=crop&auto=format` — and the
 * codebase already builds URLs in exactly that shape for card and feed images. So the
 * pipeline was: ask Sanity for a 1000px JPEG, then pay Vercel to turn that into a
 * 640px WebP. Two paid transformations to do one job, and the second one is the one
 * that ran out.
 *
 * Routing them through Sanity removes the Vercel bill entirely, works on any plan,
 * and is one fewer hop for the browser. `remotePatterns` in next.config.ts allows
 * exactly one remote host, `cdn.sanity.io`, so there is no other remote source to
 * account for; anything that is not a Sanity URL is passed through untouched.
 *
 * **The subtlety worth reading.** Many of these URLs already carry `w` *and* `h`,
 * because `resolveCardImageUrl` asks Sanity for a specific aspect ratio around an
 * editor's hotspot (1000×1250 for a 4:5 card, and see `tighten-hero-crops.ts` for the
 * square crops). Next then asks this loader for the same image at 640px. Overwriting
 * `w` and leaving `h` at 1250 would request a 640×1250 crop — a tall, narrow slice of
 * a product photo. So `h` is scaled by the same factor as `w`, which keeps the aspect
 * ratio the caller chose and the crop the editor set.
 */

/** Sanity's CDN. The only remote host next.config.ts permits. */
const SANITY_CDN = "https://cdn.sanity.io/";

/**
 * The source pixel width, read out of the asset filename.
 *
 * Sanity encodes the original dimensions in every asset path —
 * `…/e9c281ea-2000x2000.jpg` — which is the only reason the clamp below is possible
 * without a second network call.
 */
function sourceWidth(pathname: string): number | null {
  const match = /-(\d+)x(\d+)\.[a-z0-9]+$/i.exec(pathname);
  const width = match ? Number(match[1]) : NaN;
  return Number.isFinite(width) && width > 0 ? width : null;
}

export default function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Static and local files: hand back untouched. They are build-time assets with
  // hashed names, and there is nothing for Sanity to do with them.
  if (!src.startsWith(SANITY_CDN)) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  /**
   * Never ask for more pixels than were photographed.
   *
   * **Sanity upscales, and Vercel's optimiser did not.** Asked for `w=3840` from a
   * 1600×1600 source, Sanity returns a real 3840×3840 image: 84KB and 2.6s cold,
   * against 4.7KB at 640px — for a picture that cannot contain any more detail than
   * the 1600px original already held. Next puts its largest device size in the plain
   * `src` as a fallback, so every image on the page was fetching an upscale, which is
   * why the site got slower the moment it stopped going through Vercel.
   *
   * Clamping is better than capping `deviceSizes` globally, because it adapts to each
   * asset: a 4000px sauna photograph can still serve 2048, while a 700px supplier
   * thumbnail stops at 700 instead of being blown up to five times its size.
   */
  const source = sourceWidth(url.pathname);
  const requested = source ? Math.min(width, source) : width;

  const previousWidth = Number(url.searchParams.get("w"));
  const previousHeight = Number(url.searchParams.get("h"));

  // Scale a paired height by the same factor, so a 4:5 card stays 4:5 rather than
  // becoming a narrow vertical slice of the product.
  if (previousWidth > 0 && previousHeight > 0) {
    const scaled = Math.round((previousHeight / previousWidth) * requested);
    url.searchParams.set("h", String(Math.max(1, scaled)));
  }

  url.searchParams.set("w", String(requested));
  // 75 matches Next's own default, so nothing looks softer than it did.
  url.searchParams.set("q", String(quality ?? 75));
  // Serve WebP/AVIF to browsers that accept it — the other half of what the Vercel
  // optimiser was being paid for.
  url.searchParams.set("auto", "format");

  return url.toString();
}
