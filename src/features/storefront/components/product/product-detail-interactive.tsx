"use client";

import * as React from "react";

import { ProductGallery } from "@/features/storefront/components/product/product-gallery";
import { ProductSummary } from "@/features/storefront/components/product/product-summary";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Owns the "which option value is selected" state that ProductGallery and
 * ProductSummary both need — ProductDetail (the parent) is a Server
 * Component and can't hold that state itself, so this thin client wrapper
 * sits between them. Reorders the gallery so photos tagged for the current
 * selection come first (shared/untagged photos after), rather than just
 * filtering in place — ProductGallery always shows index 0 as the main
 * image, so a colour-matched photo needs to actually be first, not just
 * present somewhere in the set, or the main image looks unchanged even
 * though the thumbnail strip is filtering correctly. Falls back to the
 * full gallery whenever nothing is tagged, so untagged products render
 * exactly as before.
 */
export function ProductDetailInteractive({
  product,
}: {
  product: SanityProduct;
}) {
  const [selected, setSelected] = React.useState<Record<string, number>>(() =>
    Object.fromEntries((product.options ?? []).map((o) => [o.label, 0])),
  );

  // Trimmed + lowercased comparison — a Studio editor typing "whitewash"
  // or "Whitewash " against an option value of "Whitewash" should still
  // match. An exact-match requirement here is exactly the kind of silent,
  // hard-to-spot mismatch that makes a colour's photos never show.
  const normalize = (value: string) => value.trim().toLowerCase();
  const selectedValues = (product.options ?? [])
    .map((o) => o.values[selected[o.label] ?? 0])
    .filter((v): v is string => Boolean(v))
    .map(normalize);

  const hasTaggedImages = product.gallery.some((img) => img.optionValue);
  let reordered = product.gallery;
  if (hasTaggedImages) {
    const matched = product.gallery.filter(
      (img) =>
        img.optionValue && selectedValues.includes(normalize(img.optionValue)),
    );
    const shared = product.gallery.filter((img) => !img.optionValue);
    const combined = [...matched, ...shared];
    if (combined.length) reordered = combined;
  }
  const images = reordered.map((img) => ({ url: img.url, alt: img.alt }));

  return (
    <>
      {/* The video is not option-filtered like the photos above — there is one
          per product, and it shows whichever colour is selected. */}
      <ProductGallery
        images={images}
        name={product.name}
        video={product.video}
      />
      <ProductSummary
        product={product}
        selected={selected}
        onSelectOption={(label, index) =>
          setSelected((s) => ({ ...s, [label]: index }))
        }
        displayImage={images[0]?.url}
      />
    </>
  );
}
