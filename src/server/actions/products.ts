"use server";

import { getProductsByCategory } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/** Fetches a category's products on demand, for the room page's inline
 * expand-in-place category browser (no full page navigation). */
export async function fetchCategoryProducts(
  categorySlug: string,
): Promise<SanityProduct[]> {
  return getProductsByCategory(categorySlug, { limit: 24 });
}
