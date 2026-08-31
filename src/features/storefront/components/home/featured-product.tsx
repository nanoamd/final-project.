import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { leadTimeLine } from "@/lib/catalog/delivery";
import { formatPriceExact } from "@/lib/format";
import { getFlagshipProduct } from "@/lib/sanity/queries/product";
import { cn } from "@/lib/utils";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Featured Product — a single-product spotlight directly under the trust
 * bar: the flagship piece, presented like a gallery object rather than a
 * catalogue row. Data-driven (highest-priced buyable product), so it stays
 * current as the catalogue grows without anyone remembering to update it.
 * Renders nothing when the catalogue is empty — an absent section is more
 * premium than a placeholder.
 */
export async function FeaturedProduct() {
  const product = await getFlagshipProduct();
  if (!product?.image) return null;

  return (
    <FeaturedProductSection
      product={{ ...product, image: product.image }}
      eyebrow="The Flagship"
    />
  );
}

const LIGHT = {
  section: "bg-canvas border-line border-y",
  heading: "text-ink",
  body: "text-muted",
  highlightRule: "border-line",
  highlight: "text-ink/75",
  price: "text-ink",
  meta: "text-muted",
  secondaryButton: "text-ink/80 hover:border-ink/60 hover:text-ink border-line",
  imageBorder: "border-line",
  scrim: "from-paper/90",
  stockStatus: "text-ink/90",
};

const DARK = {
  section: "bg-basalt border-y border-white/10",
  heading: "text-canvas",
  body: "text-canvas/65",
  highlightRule: "border-white/10",
  highlight: "text-canvas/75",
  price: "text-canvas",
  meta: "text-canvas/50",
  secondaryButton:
    "text-canvas/80 hover:border-canvas/60 hover:text-canvas border-white/20",
  imageBorder: "border-white/10",
  scrim: "from-basalt/70",
  stockStatus: "text-canvas/90",
};

/** Shared layout for both the automatic flagship spotlight and the
 * hand-picked curated section (curated-featured-product.tsx) — same layout,
 * different data source, eyebrow label, and ground. Damien wants the
 * homepage's tiles to alternate black/white/black/white top to bottom, and
 * these two sections sit four rows apart in that sequence, so they need
 * opposite grounds even though they share every other pixel. `image` is
 * narrowed to a required string since both callers only render this after
 * checking the product has one. */
export function FeaturedProductSection({
  product,
  eyebrow,
  theme = "light",
}: {
  product: SanityProduct & { image: string };
  eyebrow: string;
  theme?: "light" | "dark";
}) {
  const href = `/shop/${product.category}/${product.slug}`;
  const t = theme === "dark" ? DARK : LIGHT;

  return (
    <section className={t.section}>
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12 lg:px-12 lg:py-14">
        <div className="order-2 lg:order-1">
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            {eyebrow} · {product.categoryName}
          </p>
          <h2
            className={cn(
              t.heading,
              "font-display text-2xl leading-[1.05] tracking-tight text-balance sm:text-[2.1rem]",
            )}
          >
            {product.name}
          </h2>
          <p
            className={cn(t.body, "mt-3 max-w-lg text-[14px] leading-relaxed")}
          >
            {product.summary}
          </p>

          {product.highlights.length ? (
            <ul
              className={cn(
                t.highlightRule,
                "mt-5 flex flex-col gap-2 border-l pl-4",
              )}
            >
              {product.highlights.slice(0, 3).map((highlight) => (
                <li
                  key={highlight}
                  className={cn(t.highlight, "text-[13px] leading-relaxed")}
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p
              className={cn(t.price, "font-display text-[1.6rem] leading-none")}
            >
              {formatPriceExact(product.price)}
            </p>
            <p className={cn(t.meta, "text-[13px]")}>
              Free UK delivery · {leadTimeLine(product)}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AppLink
              href={href}
              className="bg-brass text-basalt-deep hover:bg-brass/90 flex h-11 items-center rounded-md px-6 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
            >
              View the {product.categoryName.replace(/s$/, "")}
            </AppLink>
            <AppLink
              href="/quote"
              className={cn(
                t.secondaryButton,
                "flex h-11 items-center rounded-md border px-6 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors",
              )}
            >
              Ask a Question
            </AppLink>
          </div>
        </div>

        <AppLink
          href={href}
          className="group order-1 block lg:order-2"
          aria-label={`View ${product.name}`}
        >
          <div
            className={cn(
              t.imageBorder,
              "relative overflow-hidden rounded-2xl border",
            )}
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={
                  product.cardImageWide ?? product.cardImage ?? product.image
                }
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {(product.hoverImageWide ?? product.hoverImage) ? (
                <Image
                  src={(product.hoverImageWide ?? product.hoverImage)!}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              ) : null}
            </div>
            <div
              className={cn(
                t.scrim,
                "pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent",
              )}
            />
            {/* Never the supplier name here — showing who actually
                fulfils/dropships a product undercuts a premium retailer's
                own positioning and makes it trivial to search out the
                same item direct from that supplier for less. */}
            <p
              className={cn(
                t.stockStatus,
                "absolute bottom-4 left-5 text-[11px] font-medium tracking-[0.2em] uppercase",
              )}
            >
              {product.stockStatus}
            </p>
          </div>
        </AppLink>
      </div>
    </section>
  );
}
