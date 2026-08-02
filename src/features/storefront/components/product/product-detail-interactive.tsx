"use client";

import * as React from "react";

import { ProductGallery } from "@/features/storefront/components/product/product-gallery";
import { ProductSummary } from "@/features/storefront/components/product/product-summary";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Owns the "which option value is selected" state that ProductGallery and
 * ProductSummary both need — ProductDetail (the parent) is a Server
 * Component and can't hold that state itself, so this thin client wrapper
 * sits between them. Filters the gallery down to photos tagged for the
 * current selection (via each image's optionValue), falling back to the
 * full gallery whenever nothing is tagged or nothing matches, so untagged
 * products render exactly as before.
 */
export function ProductDetailInteractive({
  product,
}: {
  product: SanityProduct;
}) {
  const [selected, setSelected] = React.useState<Record<string, number>>(() =>
    Object.fromEntries((product.options ?? []).map((o) => [o.label, 0])),
  );

  const selectedValues = (product.options ?? [])
    .map((o) => o.values[selected[o.label] ?? 0])
    .filter((v): v is string => Boolean(v));

  const hasTaggedImages = product.gallery.some((img) => img.optionValue);
  const filtered = hasTaggedImages
    ? product.gallery.filter(
        (img) => !img.optionValue || selectedValues.includes(img.optionValue),
      )
    : product.gallery;
  const images = (filtered.length ? filtered : product.gallery).map(
    (img) => img.url,
  );

  return (
    <>
      <ProductGallery images={images} name={product.name} />
      <ProductSummary
        product={product}
        selected={selected}
        onSelectOption={(label, index) =>
          setSelected((s) => ({ ...s, [label]: index }))
        }
      />
    </>
  );
}
