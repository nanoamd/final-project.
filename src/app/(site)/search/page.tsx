import { SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { formatPriceExact } from "@/lib/format";
import { searchProducts } from "@/lib/sanity/queries";

export const metadata: Metadata = { title: "Search" };

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
          <SearchIcon className="text-muted size-4 shrink-0" strokeWidth={1.8} />
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search saunas, cold plunges, pergolas…"
            className="text-ink placeholder:text-muted h-full flex-1 bg-transparent text-[15px] outline-none"
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
                {product.image ? (
                  <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-xl border">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
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
