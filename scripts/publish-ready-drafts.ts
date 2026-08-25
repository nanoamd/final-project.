/**
 * Reports which never-published product drafts are complete enough to go live, and
 * publishes them on request.
 *
 * Damien said "we have more than 127 products". He is right, and this is where they
 * are: 127 products are published, and **102 more exist only as drafts that have
 * never been published**. A draft is invisible to a shopper, to the sitemap, to
 * Google and to the Merchant Center feed, so from outside the shop they do not
 * exist.
 *
 * The reason almost none of them can go live is one field. Of the 102, **94 have no
 * price**. A product with no price cannot be sold, cannot be listed, and would render
 * a card with a blank where the money goes. Prices are Damien's — "do not import
 * prices from supplier feeds" is a standing constraint — so that is not a gap code
 * can close, and this script will not guess.
 *
 * What it does: gate on the fields a live product page and a Shopping listing both
 * genuinely need, then print the ready ones and, with `--apply`, publish exactly
 * those.
 *
 * **Never-published drafts only.** A draft that has a published counterpart is an
 * edit in progress, and publishing it would push whatever half-finished text is
 * sitting in it live alongside anything intended. Those are left alone; only the
 * documents that have never been seen by a customer are candidates.
 *
 *   pnpm tsx --env-file=.env.local scripts/publish-ready-drafts.ts
 *   pnpm tsx --env-file=.env.local scripts/publish-ready-drafts.ts --apply
 *
 * Dry run by default. `--apply` makes products buyable on a live shop, so it is
 * deliberately a separate, explicit act.
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface DraftRow {
  _id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  price: number | null;
  summary: string | null;
  images: number;
  description: number;
  hasPublished: boolean;
}

const QUERY = /* groq */ `
*[_type == "product" && _id in path("drafts.**")]{
  _id, title,
  "slug": slug.current,
  "category": category->slug.current,
  price, summary,
  "images": count(gallery),
  "description": count(description),
  "hasPublished": defined(*[_id == string::split(^._id, "drafts.")[1]][0])
} | order(title asc)`;

/**
 * What a product must have before a customer sees it.
 *
 * Each one earns its place: no price means it cannot be bought; no category means it
 * has no URL and appears in no listing; no image means a blank card; no summary means
 * an empty meta description and an empty page opening; no description means the page
 * has nothing to say. A slug is the URL itself.
 */
function missingFields(row: DraftRow): string[] {
  const missing: string[] = [];
  if (!row.title?.trim()) missing.push("title");
  if (!row.slug) missing.push("slug");
  if (!row.category) missing.push("category");
  if (typeof row.price !== "number") missing.push("price");
  if (!row.summary?.trim()) missing.push("summary");
  if (!row.images) missing.push("images");
  if (!row.description) missing.push("description");
  return missing;
}

const publishedId = (draftId: string) => draftId.replace(/^drafts\./, "");

async function main() {
  const drafts = await client.fetch<DraftRow[]>(QUERY);
  const never = drafts.filter((row) => !row.hasPublished);
  const edits = drafts.filter((row) => row.hasPublished);

  console.log(
    `\n${drafts.length} product drafts — ${never.length} never published, ` +
      `${edits.length} pending edits to live products (left alone).\n` +
      `${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const ready = never.filter((row) => missingFields(row).length === 0);
  const blocked = never.filter((row) => missingFields(row).length > 0);

  console.log(`READY TO PUBLISH — ${ready.length}`);
  for (const row of ready)
    console.log(
      `   £${row.price}  ${row.images} img  ${row.category}  ${row.title?.slice(0, 56)}`,
    );

  console.log(`\nBLOCKED — ${blocked.length}`);
  const byReason = new Map<string, DraftRow[]>();
  for (const row of blocked) {
    const key = missingFields(row).join(", ");
    byReason.set(key, [...(byReason.get(key) ?? []), row]);
  }
  for (const [reason, rows] of [...byReason].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`   ${rows.length.toString().padStart(3)}  missing ${reason}`);
  }

  const noPrice = blocked.filter((row) => typeof row.price !== "number").length;
  console.log(
    `\n${noPrice} of the ${blocked.length} blocked drafts are blocked on price alone or price plus copy.\n` +
      `Prices are yours to set — this script will not invent one.\n`,
  );

  if (!ready.length) return;
  if (!apply) {
    console.log("Dry run — nothing published. Re-run with --apply.\n");
    return;
  }

  for (const row of ready) {
    // Sanity has no "publish" mutation: publishing is copying the draft onto the
    // published id and deleting the draft. Fetch the whole document rather than
    // reusing the projection above, which holds joined values (a category slug, an
    // image count) and not the fields themselves — writing that back would replace a
    // real product with a summary of one.
    const draft = await client.getDocument(row._id);
    if (!draft) {
      console.log(`  ! ${row.title} — draft vanished, skipped`);
      continue;
    }
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft as Record<
      string,
      unknown
    >;
    void _id;
    void _rev;
    void _createdAt;
    void _updatedAt;
    await client.createOrReplace({
      ...(rest as Record<string, unknown>),
      _id: publishedId(row._id),
      _type: "product",
    } as never);
    await client.delete(row._id);
    console.log(`  ✓ published  ${row.title}`);
  }
  console.log(
    `\nPublished ${ready.length}. They are live and buyable now.\n` +
      `Worth running next: scripts/derive-studio-shots.ts (flag and order their\n` +
      `images) then scripts/tighten-hero-crops.ts (make the product fill the tile).\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
