"use client";

import dynamic from "next/dynamic";
import * as React from "react";

/**
 * The matching calculator, embedded on the product page.
 *
 * ## Why this is on a product page at all
 *
 * The calculators are the only thing on this site that reliably earns organic
 * clicks — in the last 7 days they took 8 of 16, with the wall-clock tool
 * shown 69 times and the vase tool 120. The product pages took 4 between all
 * 908 of them.
 *
 * That is not a coincidence. A dropship product page competes with every
 * other shop selling the same piece, from the same supplier, with the same
 * photographs and nearly the same words. A calculator is the one thing on
 * Kaiku that none of them have — and "will this 60cm clock suit my wall" is
 * the actual question standing between a visitor and the basket.
 *
 * `toolsForCategory` has existed for a while and **no product component used
 * it**: 703 of the 908 products are in a category with a matching calculator
 * and not one of them showed it.
 *
 * ## Why lazy
 *
 * Thirteen calculators behind one shared `[product]` route would put all
 * thirteen in that route's client bundle, on every product page, to use one.
 * `next/dynamic` loads only the one this category needs. `ssr: false` is
 * deliberately NOT set — the markup is server-rendered so the content is in
 * the HTML a crawler receives, which is the whole point of putting it here.
 */

/**
 * Saunas and cold plunges are absent on purpose.
 *
 * Their calculator is `CapacityMatchCalculator`, which takes a product list
 * and a noun rather than standing alone — it matches a party size against
 * real stock, so it needs the stock. Embedding it would mean fetching a
 * category's products inside a product page to answer a question that page
 * has already answered. Those categories keep their link to the full tool,
 * which is the right place for it.
 */
const TOOLS = {
  "/tools/bed-size-calculator": dynamic(() =>
    import("@/components/shared/bed-size-calculator").then(
      (m) => m.BedSizeCalculator,
    ),
  ),
  "/tools/coffee-table-size-calculator": dynamic(() =>
    import("@/components/shared/coffee-table-size-calculator").then(
      (m) => m.CoffeeTableSizeCalculator,
    ),
  ),
  "/tools/dining-set-size-calculator": dynamic(() =>
    import("@/components/shared/dining-space-calculator").then(
      (m) => m.DiningSpaceCalculator,
    ),
  ),
  "/tools/dining-table-size-calculator": dynamic(() =>
    import("@/components/shared/dining-space-calculator").then(
      (m) => m.DiningSpaceCalculator,
    ),
  ),
  "/tools/mirror-size-calculator": dynamic(() =>
    import("@/components/shared/mirror-size-calculator").then(
      (m) => m.MirrorSizeCalculator,
    ),
  ),
  "/tools/patio-heater-size-calculator": dynamic(() =>
    import("@/components/shared/patio-heat-calculator").then(
      (m) => m.PatioHeatCalculator,
    ),
  ),
  "/tools/pendant-light-size-calculator": dynamic(() =>
    import("@/components/shared/pendant-light-calculator").then(
      (m) => m.PendantLightCalculator,
    ),
  ),
  "/tools/planter-size-calculator": dynamic(() =>
    import("@/components/shared/planter-size-calculator").then(
      (m) => m.PlanterSizeCalculator,
    ),
  ),
  "/tools/sofa-size-calculator": dynamic(() =>
    import("@/components/shared/sofa-size-calculator").then(
      (m) => m.SofaSizeCalculator,
    ),
  ),
  "/tools/tv-unit-size-calculator": dynamic(() =>
    import("@/components/shared/tv-unit-size-calculator").then(
      (m) => m.TvUnitSizeCalculator,
    ),
  ),
  "/tools/vase-size-calculator": dynamic(() =>
    import("@/components/shared/vase-size-calculator").then(
      (m) => m.VaseSizeCalculator,
    ),
  ),
  "/tools/wall-art-size-calculator": dynamic(() =>
    import("@/components/shared/wall-art-size-calculator").then(
      (m) => m.WallArtSizeCalculator,
    ),
  ),
  "/tools/wall-clock-size-calculator": dynamic(() =>
    import("@/components/shared/wall-clock-size-calculator").then(
      (m) => m.WallClockSizeCalculator,
    ),
  ),
} as const;

/** Whether a tool href has an embeddable calculator behind it. */
export function hasFitTool(href: string): href is keyof typeof TOOLS {
  return href in TOOLS;
}

export function ProductFitTool({ href }: { href: string }) {
  if (!hasFitTool(href)) return null;
  const Calculator = TOOLS[href];
  return <Calculator />;
}
