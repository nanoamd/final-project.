/**
 * Fixes a bug this session's `assign-skus.ts` run just caused: Damien,
 * trying to publish a draft, hit "Mutation failed: Document ... cannot be
 * deleted as there are references to it from ...".
 *
 * Publishing a draft deletes `drafts.X` as part of the same transaction that
 * creates/updates the published `X`. Sanity refuses to delete a document
 * something else still references — and `assign-skus.ts` created a
 * `skuAssignment` audit record with `product: {_ref: row._id}` for every
 * SKU it assigned, including on drafts, where `row._id` is literally
 * `"drafts.some-id"`. That reference is a normal (strong) one, so it blocks
 * exactly the deletion publish depends on. 835 of the 1513 skuAssignment
 * documents created this session have this shape.
 *
 * The fix is one flag: Sanity's delete-protection only looks at whether an
 * incoming reference is weak (`_weak: true`). An audit trail pointing at a
 * product it once touched should never be strong enough to block that
 * product's own lifecycle — that was the actual design mistake, not just an
 * edge case. This patches every existing skuAssignment's `product` reference
 * to `_weak: true` (nothing else changes — the reference still points at the
 * same document, still shows up if you resolve it, it just stops holding the
 * product hostage). `assign-skus.ts` is separately fixed to create weak
 * references going forward.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-sku-assignment-draft-refs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-sku-assignment-draft-refs.ts --apply
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
});

async function main() {
  // Every skuAssignment with a strong reference, draft-pointing or not — a
  // published-pointing strong reference is harmless today, but it would
  // start blocking the same way the moment that product were ever
  // unpublished back to a draft and re-published, so all of them get fixed,
  // not just the 835 currently pointing at a draft.
  const rows = await client.fetch<{ _id: string; ref: string }[]>(
    `*[_type == "skuAssignment" && defined(product._ref) && product._weak != true]{
      _id, "ref": product._ref
    }`,
  );

  console.log(
    `\n${rows.length} skuAssignment documents with a strong product reference. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let fixed = 0;
  for (const row of rows) {
    if (apply) {
      await client.patch(row._id).set({ "product._weak": true }).commit();
    }
    fixed += 1;
  }

  console.log(
    `\n${fixed} fixed. ${apply ? "APPLIED" : "Nothing written, re-run with --apply."}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
