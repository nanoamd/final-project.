/**
 * Re-extracts imported descriptions so their paragraphs survive.
 *
 * descriptionFromHtml used to run the whole panel through plainText, which
 * collapses every newline to a space. 33 of the 74 D.I. Designs pages have three
 * or four paragraphs and arrived as a single wall of text. The extractor is fixed;
 * this repairs what it already wrote.
 *
 * Not handled by --fill-existing, and deliberately so: that only ever writes
 * fields which are empty, and these descriptions are present, just flattened.
 * Rewriting a non-empty field is a different and riskier operation, so it gets its
 * own script rather than loosening the rule that makes the other one safe.
 *
 * Only rewrites where the paragraph count actually improves. A description edited
 * by hand in Studio since importing would otherwise be silently replaced by the
 * supplier's copy — so any product whose stored text no longer matches the page
 * is reported and skipped.
 *
 * The summary is left alone. It is derived from the same sentences either way, and
 * it is what Google reads, so there is no reason to churn it.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/refresh-imported-descriptions.ts --dir supplier-pages/di-designs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@sanity/client";

import {
  cleanSupplierTitle,
  descriptionFromHtml,
  titleFingerprint,
  toPortableText,
} from "./import-supplier-products";

const apply = process.argv.includes("--apply");
const dirIndex = process.argv.indexOf("--dir");
const dir = dirIndex === -1 ? undefined : process.argv[dirIndex + 1];

if (!dir) {
  console.error(
    "Give the folder of saved pages: --dir supplier-pages/di-designs",
  );
  process.exit(1);
}

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
  style?: string;
  children?: { text?: string }[];
}

const blockText = (b: Block) =>
  (b.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

async function main() {
  // One pass over the catalogue, matched on the same title fingerprint the
  // importer uses, so a page finds the product it created regardless of _id.
  const catalogue = await client.fetch<
    { _id: string; title: string; description: Block[] | null }[]
  >(`*[_type == "product" && defined(description)]{_id, title, description}`);
  const byFingerprint = new Map(
    catalogue.map((c) => [titleFingerprint(c.title), c]),
  );

  let improved = 0;
  let unchanged = 0;
  const edited: string[] = [];

  for (const entry of readdirSync(dir!)) {
    const full = join(dir!, entry);
    if (!statSync(full).isFile() || !/\.html?$/i.test(entry)) continue;
    const html = readFileSync(full, "utf8");
    const fresh = descriptionFromHtml(html);
    if (!fresh) continue;

    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (!titleMatch) continue;
    const product = byFingerprint.get(
      titleFingerprint(cleanSupplierTitle(titleMatch[1]!.trim())),
    );
    if (!product) continue;

    const stored = (product.description ?? []).filter(
      (b) => b?._type === "block",
    );
    const next = toPortableText(fresh);
    if (next.length <= stored.length) {
      unchanged++;
      continue;
    }

    // Only replace copy that is still the supplier's. Compare with punctuation
    // and spacing removed, since the flattening changed whitespace by design.
    const norm = (s: string) => s.replace(/[\s ]+/g, " ").trim();
    if (
      norm(stored.map(blockText).join(" ")) !==
      norm(fresh.split("\n\n").join(" "))
    ) {
      edited.push(product.title.slice(0, 48));
      continue;
    }

    console.log(
      `${apply ? "✓" : "·"} ${product.title.slice(0, 46).padEnd(48)}` +
        `${stored.length} block → ${next.length} paragraphs`,
    );
    if (apply)
      await client.patch(product._id).set({ description: next }).commit();
    improved++;
  }

  console.log(
    `\n${improved} description(s) ${apply ? "rebuilt" : "to rebuild"}, ${unchanged} already fine.`,
  );
  if (edited.length)
    console.log(
      `\n${edited.length} skipped — the stored copy no longer matches the page, so it has\n` +
        `been edited since importing and is not overwritten:\n` +
        edited.map((t) => `  - ${t}`).join("\n"),
    );
  if (!apply)
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
  else console.log("");
}

main().catch((err) => {
  console.error("refresh-imported-descriptions failed:", err);
  process.exit(1);
});
