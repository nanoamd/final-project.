import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { formatPriceExact } from "@/lib/format";
import { getFlagshipProduct } from "@/lib/sanity/queries/product";
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

/** Shared layout for both the automatic flagship spotlight and the
 * hand-picked curated section (curated-featured-product.tsx) — same visual
 * treatment, different data source and eyebrow label. `image` is narrowed
 * to a required string since both callers only render this after checking
 * the product has one. */
export function FeaturedProductSection({
  product,
  eyebrow,
}: {
  product: SanityProduct & { image: string };
  eyebrow: string;
}) {
  const href = `/shop/${product.category}/${product.slug}`;

  return (
    <section className="bg-basalt border-y border-white/8">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12 lg:px-12 lg:py-14">
        <div className="order-2 lg:order-1">
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            {eyebrow} · {product.categoryName}
          </p>
          <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight text-balance sm:text-[2.1rem]">
            {product.name}
          </h2>
          <p className="text-canvas/65 mt-3 max-w-lg text-[14px] leading-relaxed">
            {product.summary}
          </p>

          {product.highlights.length ? (
            <ul className="mt-5 flex flex-col gap-2 border-l border-white/10 pl-4">
              {product.highlights.slice(0, 3).map((highlight) => (
                <li
                  key={highlight}
                  className="text-canvas/75 text-[13px] leading-relaxed"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-canvas font-display text-[1.6rem] leading-none">
              {formatPriceExact(product.price)}
            </p>
            <p className="text-canvas/50 text-[13px]">
              Free UK delivery
              {product.deliveryLeadTime
                ? ` · Delivered in ${product.deliveryLeadTime}`
                : ""}
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
              className="text-canvas/80 hover:border-canvas/60 hover:text-canvas flex h-11 items-center rounded-md border border-white/20 px-6 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
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
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <div className="relative aspect-[4/3]">
              <Image
                src={product.cardImage ?? product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {product.studioImage ? (
                <Image
                  src={product.studioImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              ) : null}
            </div>
            <div className="from-basalt/70 pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />
            <p className="text-canvas/90 absolute bottom-4 left-5 text-[11px] font-medium tracking-[0.2em] uppercase">
              {product.stockStatus}
              {product.supplier?.name ? ` · ${product.supplier.name}` : ""}
            </p>
          </div>
        </AppLink>
      </div>
    </section>
  );
}
