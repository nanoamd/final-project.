/**
 * Demotes `h1` headings inside document bodies to `h2`.
 *
 * 227 blocks across 42 product descriptions are styled `h1`. Two problems, one
 * visible and one not:
 *
 *   - `h1` had no entry in portableTextComponents, so PortableText fell back to
 *     its default and those headings rendered at body-text size — a heading that
 *     does not look like a heading. That is fixed in the renderer, which now maps
 *     h1 and h4 too.
 *
 *   - Even styled correctly, an `h1` in a body is the second `h1` on the page.
 *     The template already emits one for the product or page title, and two is an
 *     outline error that screen readers announce and Google reads. The renderer
 *     works around it by emitting an `<h2>` element for an `h1` block, but the
 *     data itself should not say `h1`.
 *
 * So this fixes the data and the renderer keeps its mapping as a safety net for
 * anything typed in Studio later.
 *
 * Only `h1` moves, and only to `h2`. Existing h2 and h3 are untouched: demoting
 * the whole chain would flatten a real three-level hierarchy into two.
 *
 * Covers every document type with a rich-text body, not just products — the same
 * renderer serves pages, posts and buying guides.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/normalise-body-headings.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

/** Document type → the field holding its rich text. */
const BODY_FIELDS: { type: string; field: string }[] = [
  { type: "product", field: "description" },
  { type: "page", field: "body" },
  { type: "post", field: "body" },
  { type: "buyingGuide", field: "body" },
];

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

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { text?: string }[];
}

function blockText(block: Block): string {
  return (block.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();
}

async function main() {
  let documents = 0;
  let headings = 0;

  for (const { type, field } of BODY_FIELDS) {
    const docs = await client.fetch<
      { _id: string; title: string | null; body: Block[] | null }[]
    >(`*[_type == $type && defined(${field})]{_id, title, "body": ${field}}`, {
      type,
    });

    for (const doc of docs) {
      const body = doc.body ?? [];
      const h1s = body.filter((b) => b?._type === "block" && b.style === "h1");
      if (!h1s.length) continue;

      // Whole array rewritten rather than patched per index: a Portable Text
      // array has no stable path to "the style of block N" that survives an
      // edit in Studio between reading and writing, and _key-addressed set()
      // on an array of blocks is fiddlier than replacing the field.
      const next = body.map((b) =>
        b?._type === "block" && b.style === "h1" ? { ...b, style: "h2" } : b,
      );

      console.log(
        `${apply ? "✓" : "·"} ${type.padEnd(12)} ${String(doc.title ?? doc._id)
          .slice(0, 42)
          .padEnd(44)}` + `${h1s.length} h1 → h2`,
      );
      for (const h of h1s.slice(0, 3))
        console.log(`      "${blockText(h).slice(0, 58)}"`);
      if (h1s.length > 3) console.log(`      … and ${h1s.length - 3} more`);

      if (apply)
        await client
          .patch(doc._id)
          .set({ [field]: next })
          .commit();
      documents++;
      headings += h1s.length;
    }
  }

  console.log(
    `\n${headings} heading(s) across ${documents} document(s) ${apply ? "demoted" : "to demote"}.` +
      (apply
        ? "\nThe page template's own h1 is now the only one per page.\n"
        : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("normalise-body-headings failed:", err);
  process.exit(1);
});
