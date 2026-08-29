import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { env } from "@/env";

/**
 * On-demand revalidation for a Sanity publish webhook.
 *
 * Configure a webhook in Sanity's project dashboard (API > Webhooks) pointed at
 * `${NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`
 * with this GROQ projection as the payload:
 *
 *   {
 *     "_type": _type,
 *     "slug": slug.current,
 *     "categorySlug": category->slug.current,
 *     "categorySlugs": additionalCategories[]->slug.current,
 *     "roomSlug": category->department->slug.current
 *   }
 *
 * **What was missing.** Damien published eighteen planters and could not see
 * them: Sanity held 36, `/shop/planters` served 18. A product publish
 * revalidated `/shop`, `/shop/<category>` and the product's own page — but not
 * `/shop/<category>/all`, not `/shop/all`, and not the room pages, all of
 * which list the same products and are prerendered too. And a product
 * cross-listed through `additionalCategories` only ever cleared its *primary*
 * category, so it never appeared in the other one at all.
 *
 * `categorySlugs` and `roomSlug` are new in the projection above. The handler
 * treats both as optional, so a webhook still sending the old three fields
 * keeps working — it just clears fewer paths, and the page TTL catches the
 * rest.
 */
export async function POST(request: Request) {
  if (!env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "SANITY_REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }

  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let body: {
    _type?: string;
    slug?: string;
    categorySlug?: string;
    categorySlugs?: string[];
    roomSlug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { _type: docType, slug, categorySlug } = body;
  const revalidated: string[] = [];

  function revalidate(path: string, pathType?: "layout" | "page") {
    revalidatePath(path, pathType);
    revalidated.push(path);
  }

  switch (docType) {
    case "homepage":
      revalidate("/");
      break;
    case "navigation":
    case "siteSettings":
    case "seoDefaults":
      // Header/footer render on every storefront route.
      revalidate("/", "layout");
      break;
    case "category":
      revalidate("/shop");
      revalidate("/shop/all");
      if (slug) {
        revalidate(`/shop/${slug}`);
        revalidate(`/shop/${slug}/all`);
      }
      break;
    case "product": {
      revalidate("/shop");
      revalidate("/shop/all");
      // Every category the product appears in, not only its primary one.
      const categories = [categorySlug, ...(body.categorySlugs ?? [])].filter(
        (value): value is string => Boolean(value),
      );
      for (const category of new Set(categories)) {
        revalidate(`/shop/${category}`);
        revalidate(`/shop/${category}/all`);
      }
      if (categorySlug && slug) revalidate(`/shop/${categorySlug}/${slug}`);
      if (body.roomSlug) {
        revalidate(`/shop/room/${body.roomSlug}`);
        revalidate(`/shop/room/${body.roomSlug}/all`);
      }
      break;
    }
    case "collection":
      revalidate("/shop");
      break;
    case "page":
      if (slug) revalidate(`/${slug}`);
      break;
    case "post":
      revalidate("/journal");
      if (slug) revalidate(`/journal/${slug}`);
      break;
    case "buyingGuide":
      revalidate("/learn");
      if (slug) revalidate(`/learn/${slug}`);
      break;
    case "faq":
      revalidate("/faq");
      break;
    default:
      // Unknown/unmapped type — revalidate the homepage rather than doing
      // nothing silently.
      revalidate("/");
  }

  return NextResponse.json({ revalidated });
}
