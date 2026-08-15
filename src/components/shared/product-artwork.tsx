import {
  ART_HEIGHT,
  ART_WIDTH,
  type ArtMotif,
  artMotif,
  artPaths,
  type ArtWeight,
} from "@/lib/product/artwork";
import { cn } from "@/lib/utils";

/**
 * The decorative panel that fills the empty space beside a product page's text.
 *
 * The geometry lives in `src/lib/product/artwork.ts`; this is only how it is drawn.
 * Three deliberate decisions:
 *
 *   - **Inline SVG, not an image.** No request, no layout shift, no asset to keep in
 *     step with 99 products — and the strokes can take their colour from the theme
 *     tokens rather than being baked into a file.
 *   - **`aria-hidden`, and `lg:` only.** It is decoration, so it says nothing to a
 *     screen reader, and it does not exist on a phone: there is no empty space to
 *     fill on a narrow screen, so on mobile this would be pure scroll length.
 *   - **Very low contrast.** `line` at low opacity for the hair strokes. The test of
 *     this panel is that a shopper reading the specifications never once looks at it.
 */
const WEIGHTS: Record<ArtWeight, { className: string; width: number }> = {
  hair: { className: "text-line", width: 1 },
  fine: { className: "text-line", width: 1.4 },
  // The single burnt-orange line per panel. At /25 it was invisible against white
  // and the panel read as a grey watermark; at full strength the brand accent
  // competes with "Add to Basket", which is the only thing on the page allowed to
  // be the brightest. /45 is the setting where you can see it without looking for
  // it.
  accent: { className: "text-brass/45", width: 1.5 },
};

export function ProductArtwork({
  motif,
  slug,
  fit = "slice",
  className,
}: {
  motif: ArtMotif;
  slug: string;
  /**
   * `slice` fills the box and crops the overspill — right for a panel roughly the
   * canvas's own 5:7, where the crop only trims edges.
   *
   * `meet` scales the whole drawing to fit and leaves margins. Needed for a wide,
   * short slot: the drawings are compositions, not repeating patterns, and a 16:9
   * crop of a 400×560 canvas cuts the base off the arches, the shade off the
   * pendant and the paving out of the garden. The margins are invisible anyway —
   * the SVG has no background of its own and the panel behind it is `bg-paper`, so
   * it reads as a plate in a book rather than as a cropped photograph.
   */
  fit?: "slice" | "meet";
  className?: string;
}) {
  const layers = artPaths(motif, slug);
  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      {(["hair", "fine", "accent"] as const).map((weight) => {
        const paths = layers.filter((layer) => layer.weight === weight);
        if (!paths.length) return null;
        const style = WEIGHTS[weight];
        return (
          <g
            key={weight}
            className={style.className}
            stroke="currentColor"
            strokeWidth={style.width}
            // Grouped by weight so the whole panel is three <g> elements rather
            // than a stroke attribute repeated on 40 paths.
            opacity={weight === "hair" ? 0.75 : 1}
          >
            {paths.map((layer, i) => (
              <path key={i} d={layer.d} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The framed side panel: artwork on the paper surface, with a small label.
 *
 * The label is the one piece of text, and it is factual — the category this product
 * sits in, which the page already states in its breadcrumb. It exists because an
 * unlabelled decorative box beside a specification table reads as a failed image
 * load, and two words of context make the same box read as intentional.
 */
export function ProductArtPanel({
  product,
  label,
  fit,
  className,
}: {
  product: {
    slug: string;
    category?: string | null;
    departmentSlug?: string | null;
  };
  /** Usually the category name. Omit for artwork with no caption at all. */
  label?: string | null;
  fit?: "slice" | "meet";
  className?: string;
}) {
  const motif = artMotif({
    department: product.departmentSlug,
    category: product.category,
  });

  return (
    <div
      className={cn(
        "border-line bg-paper relative hidden overflow-hidden rounded-2xl border lg:block",
        className,
      )}
    >
      <ProductArtwork motif={motif} slug={product.slug} fit={fit} />
      {label ? (
        <p className="text-muted absolute bottom-4 left-5 text-[10px] font-semibold tracking-[0.18em] uppercase">
          {label}
        </p>
      ) : null}
    </div>
  );
}
