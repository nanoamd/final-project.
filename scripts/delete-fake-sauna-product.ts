/**
 * Deletes the placeholder "Kaiku Horizon Cabin Sauna" product — a fake
 * product (not the real "Auroom Horizon Sauna" from scripts/seed-sanity.ts)
 * that ended up published and was showing as the homepage's automatic
 * flagship spotlight. Matched by exact title rather than a guessed slug,
 * since its slug was never confirmed. Deletes both the draft and published
 * document if both exist. Logs what it found before deleting, in case the
 * title match is broader than expected.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/delete-fake-sauna-product.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

const TARGET_TITLE = "Kaiku Horizon Cabin Sauna";

async function main() {
  const docs = await client.fetch<
    { _id: string; title: string; slug?: string }[]
  >(
    `*[_type == "product" && title == $title]{ _id, title, "slug": slug.current }`,
    {
      title: TARGET_TITLE,
    },
  );

  if (!docs.length) {
    console.log(
      `No product titled "${TARGET_TITLE}" found — either already deleted, or the title doesn't match exactly. Nothing done.`,
    );
    return;
  }

  for (const doc of docs) {
    console.log(`Deleting ${doc._id} (slug: ${doc.slug ?? "none"})`);
    await client.delete(doc._id);
  }

  console.log(`\nDone — deleted ${docs.length} document(s).`);
}

main().catch((err) => {
  console.error("delete-fake-sauna-product failed:", err);
  process.exit(1);
});
