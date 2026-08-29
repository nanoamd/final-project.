import { SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { formatPriceExact } from "@/lib/format";
import { searchProducts } from "@/lib/sanity/queries";

// Search result pages are thin, near-duplicate content that shouldn't
// compete with real category/product pages in Google — standard practice
// is to noindex them while still letting links from them be followed.
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const results = term ? await searchProducts(term, 24) : [];

  return (
    <Container className="py-16 md:py-20">
      <Eyebrow>Search</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-3xl tracking-tight sm:text-4xl">
        Search products
      </h1>

      <form action="/search" method="get" className="mt-8 max-w-lg">
        <label className="border-line bg-paper focus-within:border-ink flex h-13 items-center gap-3 rounded-full border px-5">
          <SearchIcon
            className="text-muted size-4 shrink-0"
            strokeWidth={1.8}
          />
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search saunas, cold plunges, pergolas…"
            className="text-ink placeholder:text-muted h-full flex-1 bg-transparent text-base outline-none sm:text-[15px]"
          />
        </label>
      </form>

      {term ? (
        results.length ? (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((product) => (
              <AppLink
                key={product.slug}
                href={`/shop/${product.category}/${product.slug}`}
                className="group"
              >
                {(product.cardImageSquare ??
                product.cardImage ??
                product.image) ? (
                  <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-xl border">
                    <Image
                      src={
                        (product.cardImageSquare ??
                          product.cardImage ??
                          product.image)!
                      }
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    {(product.hoverImageSquare ?? product.hoverImage) ? (
                      <Image
                        src={(product.hoverImageSquare ?? product.hoverImage)!}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="absolute inset-0 object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    ) : null}
                  </div>
                ) : (
                  <PlaceholderImage
                    tone="sand"
                    illustration="leaf"
                    aspect="aspect-square"
                    className="rounded-xl"
                  />
                )}
                <p className="text-ink group-hover:text-brass mt-3 text-[14px] font-medium transition-colors">
                  {product.name}
                </p>
                <p className="text-muted mt-1 text-[13px]">
                  {formatPriceExact(product.price)}
                </p>
              </AppLink>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-12">
            No products matched &ldquo;{term}&rdquo;. Try a different term, or{" "}
            <AppLink href="/shop" className="text-brass">
              browse the full collection
            </AppLink>
            .
          </p>
        )
      ) : (
        <p className="text-muted mt-12">
          Search across every product by name or description.
        </p>
      )}
    </Container>
  );
}
