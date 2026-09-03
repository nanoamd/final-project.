/**
 * Four empty category drafts were hiding the published content in Studio.
 *
 * This is the answer to an argument I got wrong repeatedly. Damien sent
 * screenshots of Side Tables with "SEO introduction" and "Buying guidance"
 * reading Empty, and said so again and again. I checked, reported "49
 * categories, 0 drafts, 0 empty", and told him the data was there and his tab
 * must be stale.
 *
 * **My draft check was unauthenticated.** Sanity does not serve drafts to a
 * client with no token, so `*[_id in path("drafts.**")]` returned an empty array
 * and I read that as "there are no drafts" rather than "I cannot see drafts".
 * With a token the same query returns 740 documents. Studio, which is
 * authenticated, was showing him the draft; my scripts were reading the
 * published document and insisting.
 *
 * Console Tables, Side Tables, Sofas and Wall Art each have a draft carrying no
 * intro, no buying guidance, no FAQs and no meta title, over a published version
 * that has all four. Because Studio always shows the draft when one exists, all
 * that content is invisible in the editor — and publishing the draft would have
 * destroyed it.
 *
 * The fix copies the published values into the draft rather than deleting the
 * draft, so any other unpublished edit on it survives and publishing becomes
 * safe instead of destructive.
 *
 * Garden Furniture is deliberately untouched: its draft holds FOUR intro blocks
 * against the published two, so that one is genuine unpublished work of Damien's
 * and not mine to overwrite.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-empty-category-drafts.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-empty-category-drafts.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error(
    "SANITY_API_WRITE_TOKEN is required — drafts are not readable without it, " +
      "which is the whole reason this bug went unnoticed.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/** Fields whose absence on a draft hides published content in the editor. */
const FIELDS = [
  "intro",
  "buyingGuide",
  "faqs",
  "seo",
  // Products carry the content that matters most here.
  "description",
  "summary",
  "specs",
  "gallery",
] as const;

function len(value: unknown) {
  return Array.isArray(value) ? value.length : value ? 1 : 0;
}

async function main() {
  /*
   * Products as well as categories.
   *
   * The same bug is on 90 product drafts: the Glass Candle Holder's draft holds
   * 1,342 characters of description against 5,479 on the published document. So
   * Studio shows the short version — which is why Damien was looking at short
   * descriptions in Sanity and concluding they had been destroyed, while the
   * live site served the long one.
   *
   * It is also a live hazard rather than only a display problem: pressing
   * Publish on any of those 90 would overwrite the recovered description with
   * the stub. Copying published into draft removes the hazard.
   */
  const type = process.argv.includes("--products") ? "product" : "category";
  const drafts = await client.fetch<
    { _id: string; slug?: string; title?: string }[]
  >(
    `*[_type==$type && _id in path("drafts.**")]{_id,"slug":slug.current,title}`,
    { type },
  );
  console.log(`${drafts.length} ${type} drafts found.\n`);

  const results: Record<string, unknown>[] = [];

  for (const draft of drafts) {
    const publishedId = draft._id.replace(/^drafts\./, "");
    const [full, published] = await Promise.all([
      client.fetch<Record<string, unknown> | null>(`*[_id==$id][0]`, {
        id: draft._id,
      }),
      client.fetch<Record<string, unknown> | null>(`*[_id==$id][0]`, {
        id: publishedId,
      }),
    ]);
    if (!full || !published) continue;

    const patch: Record<string, unknown> = {};
    const restored: string[] = [];
    for (const field of FIELDS) {
      const draftLen = len(full[field]);
      const pubLen = len(published[field]);
      // Only where the draft is emptier than the published document. A draft
      // holding MORE is unpublished work and is left exactly as it is.
      if (pubLen > draftLen) {
        patch[field] = published[field];
        restored.push(`${field} ${draftLen}->${pubLen}`);
      }
    }

    if (restored.length === 0) {
      results.push({ slug: draft.slug, action: "left alone" });
      continue;
    }

    console.log(
      `  ${String(draft.slug ?? draft._id)
        .slice(0, 40)
        .padEnd(42)} ${restored.join(", ")}`,
    );
    results.push({ slug: draft.slug, action: "restored", restored });

    if (apply) {
      await client.patch(draft._id).set(patch).commit();
    }
  }

  console.log(
    `\n${results.filter((r) => r.action === "restored").length} drafts ${apply ? "fixed" : "would be fixed"}.`,
  );
  if (apply)
    console.log(
      "Studio will now show the content on these categories, and publishing the draft is safe.",
    );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/2026-09-03-fix-empty-${type}-drafts.json`,
    JSON.stringify({ apply, results }, null, 2),
  );
  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
