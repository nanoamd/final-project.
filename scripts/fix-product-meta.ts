/**
 * Product meta titles and descriptions, rebuilt from the product's own data.
 *
 * Two separate defects, found by auditing the `seo` object properly for the
 * first time (the earlier audit read `seoTitle`/`seoDescription`, which do not
 * exist — SEO is a nested object, so it reported all 906 as empty and I
 * dismissed the row as my own bug without then checking the real field).
 *
 * 1. 209 meta titles carry a literal "…" where something truncated them
 *    mid-phrase and then appended " | Kaiku". On four Freska jars that cut off
 *    "1100ml", "800ml", "550ml" and "250ml" — the only thing telling them
 *    apart — so all four went to Google under one identical title. Ten such
 *    groups exist.
 *
 * 2. 806 of 906 meta descriptions are supplier marketing filler: "Shop the X at
 *    Kaiku, a perfect addition for charming home ambience. Premium UK homewares
 *    for modern interiors". That is the voice Damien told me to get out of the
 *    copy, and it is worse here than anywhere else because this is the line a
 *    searcher reads before deciding whether to click.
 *
 * The summaries were rewritten from each product's own specs earlier today, so
 * they are the right source for a description. The titles were de-stuffed in the
 * same pass, so they are the right source for a title.
 *
 * No ellipsis is ever written into a title. Where a title is too long for the
 * ~60 characters Google renders, the middle descriptor segment is dropped
 * ("Name | Rustic Teak Furniture | Kaiku" becomes "Name | Kaiku") rather than
 * cutting a word in half. Where it is still long after that, it is left whole:
 * a long product name renders truncated, which is cosmetic, while a mutilated
 * one loses the size or capacity that distinguishes it, which is not.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-product-meta.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-product-meta.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;
const DESC_MIN = 70;

/**
 * The phrases that mark a description as supplier or generated filler rather
 * than a statement about the product.
 *
 * Each of these is a construction that says nothing: "Shop the X at Kaiku" tells
 * a searcher only that we sell it, which they can see from the result itself.
 * Deliberately NOT listed: any phrase that could carry a fact.
 */
const FILLER = [
  /\bShop the\b/i,
  /\bDiscover our\b/i,
  /\bDiscover the\b/i,
  /\bExplore our\b/i,
  /\bperfect addition\b/i,
  /\bPremium UK homewares for modern interiors\b/i,
  /\bfor a touch of\b/i,
  /\benhance your\b/i,
  /\bavailable at Kaiku\b/i,
  /\bFree UK delivery available\b/i,
  /\bideal for\b/i,
  /\belevate your\b/i,
  /\bstylish and\b/i,
];

/** Splits on sentence ends, keeping the punctuation with the sentence. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * A meta description built from the summary: whole sentences, up to the limit.
 *
 * Returns null rather than a bad description when the summary cannot produce
 * one — the caller then leaves the field alone, because buildMetadata already
 * falls back to the full summary and that is better than a truncated fragment.
 */
function describeFrom(summary: string): string | null {
  const clean = summary.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= DESC_LIMIT) {
    return clean.length >= DESC_MIN ? clean : null;
  }

  let out = "";
  for (const sentence of sentences(clean)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > DESC_LIMIT) break;
    out = next;
  }
  if (out.length >= DESC_MIN) return out;

  // The first sentence alone is over the limit. Cut at a word boundary and mark
  // it, rather than ending mid-word — Google truncates a long description
  // anyway, so the only thing being chosen here is where it reads as deliberate.
  const cut = clean.slice(0, DESC_LIMIT - 1);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace < DESC_MIN) return null;
  return `${cut.slice(0, lastSpace).replace(/[,;:]$/, "")}…`;
}

/**
 * A meta title built from the product title.
 *
 * Product titles are pipe-separated: "Name | Descriptor | Kaiku". The brand
 * stays, the name stays, and only a middle descriptor is dropped, and only when
 * dropping it is what brings the title inside the limit.
 */
function titleFrom(productTitle: string): string {
  const parts = productTitle
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return productTitle.trim();

  const brand = parts[parts.length - 1] === "Kaiku" ? "Kaiku" : null;
  const body = brand ? parts.slice(0, -1) : parts;
  const name = body[0] ?? productTitle.trim();

  const join = (segments: string[]) =>
    brand ? [...segments, brand].join(" | ") : segments.join(" | ");

  const full = join(body);
  if (full.length <= TITLE_LIMIT) return full;

  // Drop descriptors from the end of the body, keeping the name, until it fits.
  for (let keep = body.length - 1; keep >= 1; keep -= 1) {
    const candidate = join(body.slice(0, keep));
    if (candidate.length <= TITLE_LIMIT) return candidate;
  }
  // The name alone is still over the limit. Leave it whole — see the header.
  return join([name]);
}

async function main() {
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      summary?: string;
      seo?: { metaTitle?: string; metaDescription?: string };
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,summary,seo}`,
  );

  const results: Record<string, unknown>[] = [];
  let transaction = client.transaction();
  let queued = 0;
  let committed = 0;
  let titleFixes = 0;
  let descFixes = 0;
  let descSkipped = 0;

  for (const p of products) {
    const currentTitle = p.seo?.metaTitle?.trim() ?? "";
    const currentDesc = p.seo?.metaDescription?.trim() ?? "";
    const patch: Record<string, unknown> = {};

    // A title is rewritten when it is truncated with an ellipsis, when it is
    // empty, or when it is over the limit and the product title would do better.
    const titleBroken =
      currentTitle.includes("…") ||
      currentTitle.includes("...") ||
      !currentTitle;
    const rebuiltTitle = titleFrom(p.title);
    if (
      titleBroken ||
      (currentTitle.length > TITLE_LIMIT &&
        rebuiltTitle.length < currentTitle.length)
    ) {
      if (rebuiltTitle && rebuiltTitle !== currentTitle) {
        patch["seo.metaTitle"] = rebuiltTitle;
        titleFixes += 1;
      }
    }

    const descBroken =
      !currentDesc ||
      currentDesc.length > DESC_LIMIT ||
      FILLER.some((re) => re.test(currentDesc));
    if (descBroken) {
      const rebuilt = describeFrom(p.summary ?? "");
      if (rebuilt && rebuilt !== currentDesc) {
        patch["seo.metaDescription"] = rebuilt;
        descFixes += 1;
      } else if (!rebuilt) {
        descSkipped += 1;
      }
    }

    if (Object.keys(patch).length === 0) continue;

    results.push({
      id: p._id,
      title: p.title,
      titleWas: currentTitle || null,
      titleNow: patch["seo.metaTitle"] ?? null,
      descWas: currentDesc || null,
      descNow: patch["seo.metaDescription"] ?? null,
    });

    if (apply) {
      transaction.patch(p._id, (patcher) => patcher.set(patch));
      queued += 1;
      // Sanity rejects very large transactions; commit in batches.
      if (queued >= 100) {
        await transaction.commit();
        committed += queued;
        queued = 0;
        transaction = client.transaction();
      }
    }
  }

  console.log(`Products scanned:        ${products.length}`);
  console.log(`Meta titles rebuilt:     ${titleFixes}`);
  console.log(`Meta descriptions built: ${descFixes}`);
  console.log(`Descriptions left alone: ${descSkipped} (no usable summary)`);
  console.log(`Documents touched:       ${results.length}`);

  const over = results.filter(
    (r) =>
      (typeof r.titleNow === "string" && r.titleNow.length > TITLE_LIMIT) ||
      (typeof r.descNow === "string" && r.descNow.length > DESC_LIMIT),
  );
  console.log(`Still over length after rebuild: ${over.length}`);
  for (const r of over.slice(0, 8))
    console.log(`  ${String(r.titleNow ?? r.descNow).slice(0, 80)}`);

  console.log("\nSample:");
  for (const r of results.slice(0, 4)) {
    console.log(`\n${r.id}`);
    if (r.titleNow)
      console.log(`  T was: ${r.titleWas}\n  T now: ${r.titleNow}`);
    if (r.descNow) console.log(`  D was: ${r.descWas}\n  D now: ${r.descNow}`);
  }

  if (apply) {
    if (queued > 0) {
      await transaction.commit();
      committed += queued;
    }
    console.log(`\nApplied: ${committed} documents patched.`);
  } else {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-product-meta.json",
    JSON.stringify(
      { apply, titleFixes, descFixes, descSkipped, results },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
