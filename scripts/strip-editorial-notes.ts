/**
 * Removes editorial leftovers from published product descriptions.
 *
 * Two kinds, both visible on the live site:
 *
 *   - A note written to ourselves that was never meant to ship. The Sweet Birch
 *     50ml page ends with "Note: Avoid making claims about therapeutic or medical
 *     benefits … while still being SEO-friendly." A shopper reading that learns
 *     how the page was written.
 *
 *   - Headings ending in " Copy" — "Delivery & Returns Copy", "Warranty Copy" —
 *     where the word was a label for the drafting process, not part of the
 *     heading. Five products carry one.
 *
 * The note is deleted. The heading keeps its text and loses the suffix, because
 * the section itself is wanted; only the label was wrong.
 *
 * Whole-array rewrite rather than per-index patching, for the same reason as
 * normalise-body-headings: a Portable Text array has no stable path to "block N"
 * that survives an edit between reading and writing.
 *
 * Runs over drafts as well as published documents — a stale draft carrying the same
 * note would put it straight back on publish.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/strip-editorial-notes.ts
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

interface Span {
  _type?: string;
  text?: string;
}

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: Span[];
}

const blockText = (b: Block) =>
  (b.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

/** Text that is a note to the author rather than copy for a shopper. */
const AUTHOR_NOTE =
  /^note\s*:|avoid making claims|SEO-friendly|^\s*(TODO|FIXME)\b/i;

/** A drafting label stuck on the end of an otherwise fine heading. */
const COPY_SUFFIX = /\s+Copy$/;

async function main() {
  const docs = await client.fetch<
    { _id: string; title: string; description: Block[] | null }[]
  >(
    `*[_type == "product" && defined(description)]{_id, title, description}|order(title asc)`,
  );

  let notesRemoved = 0;
  let headingsFixed = 0;
  let touched = 0;

  for (const doc of docs) {
    const body = doc.description ?? [];
    const removals: string[] = [];
    const renames: string[] = [];

    const next = body
      .filter((b) => {
        if (b._type !== "block") return true;
        const text = blockText(b);
        if (text && AUTHOR_NOTE.test(text)) {
          removals.push(text.slice(0, 80));
          return false;
        }
        return true;
      })
      .map((b) => {
        if (b._type !== "block" || !b.style?.startsWith("h")) return b;
        const text = blockText(b);
        if (!COPY_SUFFIX.test(text)) return b;
        renames.push(text);
        // Only the first span carries the heading text in practice, but rebuild
        // across all of them so a split heading is handled too.
        let remaining = text.replace(COPY_SUFFIX, "");
        const children = (b.children ?? []).map((span) => {
          const take = remaining.slice(0, (span.text ?? "").length);
          remaining = remaining.slice(take.length);
          return { ...span, text: take };
        });
        return { ...b, children };
      });

    if (!removals.length && !renames.length) continue;

    console.log(
      `${apply ? "✓" : "·"} ${(doc._id.startsWith("drafts.") ? "draft " : "live  ") + doc.title.slice(0, 46)}`,
    );
    for (const r of removals) console.log(`      removed note: "${r}"`);
    for (const r of renames)
      console.log(`      heading: "${r}" → "${r.replace(COPY_SUFFIX, "")}"`);

    if (apply) await client.patch(doc._id).set({ description: next }).commit();

    notesRemoved += removals.length;
    headingsFixed += renames.length;
    touched++;
  }

  console.log(
    `\n${notesRemoved} note(s) and ${headingsFixed} heading(s) across ${touched} document(s) ` +
      `${apply ? "fixed" : "to fix"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("strip-editorial-notes failed:", err);
  process.exit(1);
});
