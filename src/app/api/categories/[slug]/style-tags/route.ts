import { NextResponse } from "next/server";

import { getCategoryStyleTags } from "@/lib/sanity/queries/product";

/**
 * Distinct style tags among a category's products — the shop drill-nav's
 * third tier fetches this on demand as each category expands. A route
 * handler rather than a server action so the client component that calls it
 * (components/shared/shop-drill-nav.tsx) can stay a plain presentational
 * import for the layout, per the architectural boundary rules (only `app`
 * and `feature` may depend on `server`/`lib` directly).
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/categories/[slug]/style-tags">,
) {
  const { slug } = await ctx.params;
  const tags = await getCategoryStyleTags(slug);
  return NextResponse.json({ tags });
}
