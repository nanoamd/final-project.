import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { env } from "@/env";

/**
 * On-demand revalidation for a Sanity publish webhook, on top of the 60s ISR
 * floor every page already has. Configure a webhook in Sanity's project
 * dashboard (API > Webhooks) pointed at
 * `${NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`
 * with this GROQ projection as the payload, so category/product edits know
 * which path to invalidate:
 *
 *   {
 *     "_type": _type,
 *     "slug": slug.current,
 *     "categorySlug": category->slug.current
 *   }
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

  let body: { _type?: string; slug?: string; categorySlug?: string };
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
      if (slug) revalidate(`/shop/${slug}`);
      break;
    case "product":
      revalidate("/shop");
      if (categorySlug) revalidate(`/shop/${categorySlug}`);
      if (categorySlug && slug) revalidate(`/shop/${categorySlug}/${slug}`);
      break;
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
