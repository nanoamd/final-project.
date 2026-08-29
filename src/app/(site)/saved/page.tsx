"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useCart } from "@/hooks/use-cart";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { formatPriceExact } from "@/lib/format";

export default function SavedPage() {
  const { items, remove } = useSavedProducts();
  const { addItem } = useCart();
  const [added, setAdded] = React.useState<string | null>(null);

  function handleAddToBasket(item: (typeof items)[number]) {
    addItem({
      slug: item.slug,
      category: item.category,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    setAdded(item.slug);
    window.setTimeout(() => setAdded(null), 2000);
  }

  if (!items.length) {
    return (
      <Container className="py-24 text-center md:py-32">
        <Eyebrow>Saved</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-3xl tracking-tight">
          Nothing saved yet
        </h1>
        <p className="text-muted mt-3">
          Tap the heart on any product page to keep it here for later.
        </p>
        <AppLink
          href="/shop"
          className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
        >
          Explore Collections
        </AppLink>
      </Container>
    );
  }

  return (
    <Container className="py-16 md:py-20">
      <Eyebrow>Saved</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-3xl tracking-tight sm:text-4xl">
        Saved for later
      </h1>

      <ul className="divide-line mt-10 flex flex-col divide-y">
        {items.map((item) => (
          <li key={item.slug} className="flex gap-5 py-6 first:pt-0">
            <div className="border-line bg-paper relative size-24 shrink-0 overflow-hidden rounded-lg border">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <AppLink
                  href={`/shop/${item.category}/${item.slug}`}
                  className="text-ink hover:text-brass font-display text-lg transition-colors"
                >
                  {item.name}
                </AppLink>
                <p className="text-ink text-[15px] font-medium">
                  {formatPriceExact(item.price)}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleAddToBasket(item)}
                  className="border-ink/25 text-ink hover:border-ink flex h-9 items-center justify-center rounded-full border px-4 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors"
                >
                  {added === item.slug ? "Added ✓" : "Add to Basket"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.slug)}
                  aria-label="Remove from saved"
                  className="text-muted hover:text-ink flex items-center gap-1.5 text-[12px] transition-colors"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
