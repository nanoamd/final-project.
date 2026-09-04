/**
 * Two supplier-name leaks the general sweep in
 * fix-supplier-leaks-in-descriptions.ts couldn't catch, because they don't
 * match either of that script's two shapes (a whole leaked block, or a
 * span carrying the supplier's own hyperlink):
 *
 *   - product-aw-preo-76: an FAQ-style answer says "supplied by Ancient
 *     Wisdom" in the middle of an otherwise-fine sentence — no link, no
 *     isolated block, just prose naming the supplier directly.
 *   - product-import-aegina-table-lamp: "Hill Interiors" sits inside a
 *     heading and inside a sentence (not trailing on a link span), and the
 *     sentence that follows the (now-removed, by the earlier sweep) link
 *     ends with a dangling "(" the general script's orphan-punctuation
 *     check doesn't reach, since it's fused onto the end of a real content
 *     span rather than being its own bare-punctuation span.
 *
 * Found by re-scanning for "Ancient Wisdom" / "Hill Interiors" in
 * description text after the general sweep ran — 2 of 46 fixed products
 * still had a residual mention, hand-verified and hand-fixed here rather
 * than generalizing the detector further for two cases.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-leaks-stragglers.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-leaks-stragglers.ts --apply
 */
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
  perspective: "raw",
});

const FIXES: {
  id: string;
  blockKey: string;
  before: string;
  after: string;
}[] = [
  {
    id: "product-aw-preo-76",
    blockKey: "4f0db5ec73f5",
    before:
      "Yes. This product is supplied by Ancient Wisdom as a premium essential oil for aromatherapy and home fragrance use.",
    after:
      "Yes. This is a premium essential oil for aromatherapy and home fragrance use.",
  },
  {
    id: "product-import-aegina-table-lamp",
    blockKey: "e4ddaea6f7e4",
    before: "Pair With Hill Interiors Lighting Collections",
    after: "Pair With Similar Lighting Collections",
  },
  {
    id: "product-import-aegina-table-lamp",
    blockKey: "6c5423ed63b4",
    before:
      "The Aegina Table Lamp works particularly well alongside other Hill Interiors wooden lighting designs, including the Incia Collection and sculptural lamps such as the Uthina and Pula ranges. (",
    after:
      "The Aegina Table Lamp works particularly well alongside other wooden lighting designs, including the Incia Collection and sculptural lamps such as the Uthina and Pula ranges.",
  },
];

async function main() {
  for (const fix of FIXES) {
    const doc = await client.fetch<{
      description: { _key: string; children: { text: string }[] }[];
    } | null>(`*[_id==$id][0]{description}`, { id: fix.id });
    if (!doc) {
      console.error(`${fix.id}: not found`);
      continue;
    }
    const block = doc.description.find((b) => b._key === fix.blockKey);
    if (!block) {
      console.error(`${fix.id}: block ${fix.blockKey} not found`);
      continue;
    }
    const actualText = block.children.map((c) => c.text).join("");
    if (actualText !== fix.before) {
      console.error(
        `${fix.id}: block ${fix.blockKey} text doesn't match expected — skipping.\n  expected: "${fix.before}"\n  actual:   "${actualText}"`,
      );
      continue;
    }
    console.log(
      `${fix.id} [${fix.blockKey}]\n  before: "${fix.before}"\n  after:  "${fix.after}"`,
    );
    if (!apply) continue;
    await client
      .patch(fix.id)
      .set({
        [`description[_key=="${fix.blockKey}"].children[0].text`]: fix.after,
      })
      .commit();
  }
  console.log(apply ? "\nApplied." : "\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
