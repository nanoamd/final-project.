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
/**
 * The params are written out rather than using the generated
 * `RouteContext<"/api/categories/[slug]/style-tags">` helper.
 *
 * That helper is a global Next.js emits into `.next/types` during a build, so it
 * only exists once the app has been built. `pnpm typecheck` runs before
 * `pnpm build` in CI, which meant `tsc --noEmit` failed with "Cannot find name
 * 'RouteContext'" on a clean checkout while passing on any machine that happened
 * to have a `.next` directory lying around — including mine, which is why it
 * reached the branch at all.
 *
 * Route handler params are a `Promise` in this version of Next.js; see
 * node_modules/next/dist/docs.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const tags = await getCategoryStyleTags(slug);
  return NextResponse.json({ tags });
}
