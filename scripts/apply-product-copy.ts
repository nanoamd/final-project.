/**
 * Writes rewritten product copy into Sanity.
 *
 * Copy is authored as one JSON file per product under `product-copy/`, matching the
 * ProductCopy shape. Authoring as data rather than as patches means the copy can be
 * checked before it reaches the site, and checked as a set rather than one product
 * at a time — which is the only way to catch the same FAQ being written for thirty
 * products.
 *
 * Validation is a gate, not advice. A single error anywhere stops the whole run:
 * a half-applied rewrite leaves the catalogue in two voices, which is worse than
 * the state it started in.
 *
 * Cross-checks against copy already in Sanity too, so a product rewritten in an
 * earlier batch still counts when deduplicating FAQs.
 *
 * Writes description, summary, faqs, and — where the file provides them — tagline,
 * specs, highlights, deliveryNotes and warrantyNotes. Never touches price, title,
 * slug, images, stock or lead time.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/apply-product-copy.ts
 *   pnpm tsx --env-file=.env.local scripts/apply-product-copy.ts --dir product-copy/batch-1 --apply
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@sanity/client";

import {
  buildDescription,
  faqKey,
  type ProductCopy,
  validateCopy,
} from "./lib/product-copy";

const apply = process.argv.includes("--apply");
const dirIndex = process.argv.indexOf("--dir");
const dir = dirIndex === -1 ? "product-copy" : process.argv[dirIndex + 1]!;

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

/** Every .json file under dir, recursing one level so batches can be folders. */
function copyFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) found.push(...copyFiles(full));
    else if (entry.endsWith(".json")) found.push(full);
  }
  return found.sort();
}

async function main() {
  let files: string[];
  try {
    files = copyFiles(dir);
  } catch {
    console.error(`No such directory: ${dir}`);
    process.exit(1);
  }

  if (!files.length) {
    console.log(`\nNo .json copy files under ${dir}/ — nothing to do.\n`);
    return;
  }

  const batch: { file: string; copy: ProductCopy }[] = [];
  for (const file of files) {
    try {
      batch.push({ file, copy: JSON.parse(readFileSync(file, "utf8")) });
    } catch (err) {
      console.error(`${file}: not valid JSON — ${(err as Error).message}`);
      process.exit(1);
    }
  }

  console.log(`\n${batch.length} product(s) of copy under ${dir}/\n`);

  // FAQ questions already live on other products, so a question reused across
  // batches is caught as well as one reused inside this batch.
  const ids = batch.map((b) => b.copy.productId);
  const existing = await client.fetch<
    { _id: string; title: string; faqs: { question: string }[] | null }[]
  >(`*[_type == "product" && !(_id in path("drafts.**"))]{_id, title, faqs}`);
  const byId = new Map(existing.map((d) => [d._id, d]));

  const otherFaqs = new Set<string>();
  for (const doc of existing) {
    if (ids.includes(doc._id)) continue;
    for (const faq of doc.faqs ?? []) otherFaqs.add(faqKey(faq.question));
  }

  let errors = 0;
  let warnings = 0;

  for (const { copy } of batch) {
    const target = byId.get(copy.productId);
    const issues = validateCopy(copy, otherFaqs);

    // Questions in this file count against every later file in the batch.
    for (const faq of copy.faqs) otherFaqs.add(faqKey(faq.question));

    const errs = issues.filter((i) => i.severity === "error");
    const warns = issues.filter((i) => i.severity === "warning");
    errors += errs.length;
    warnings += warns.length;
    if (!target) {
      errors++;
      console.log(`✗ ${copy.title}`);
      console.log(
        `    no published product with _id ${copy.productId} — check the id`,
      );
      continue;
    }

    const status = errs.length ? "✗" : warns.length ? "!" : apply ? "✓" : "·";
    console.log(
      `${status} ${copy.title.slice(0, 58).padEnd(60)} ${copy.sections.length} sections, ${copy.faqs.length} FAQs`,
    );
    for (const issue of errs) console.log(`    ERROR   ${issue.what}`);
    for (const issue of warns) console.log(`    warn    ${issue.what}`);
  }

  if (errors) {
    console.error(
      `\n${errors} error(s) and ${warnings} warning(s). Nothing written —` +
        ` fix the errors and re-run.\n` +
        `A half-applied rewrite leaves the catalogue in two voices.\n`,
    );
    process.exit(1);
  }

  if (!apply) {
    console.log(
      `\nAll ${batch.length} passed with ${warnings} warning(s).` +
        `\nDry run — nothing written. Re-run with --apply.\n`,
    );
    return;
  }

  for (const { copy } of batch) {
    const set: Record<string, unknown> = {
      description: buildDescription(copy.sections),
      summary: copy.summary,
      faqs: copy.faqs.map((faq, i) => ({
        _key: `faq${i}${Math.abs(
          [...faq.question].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
        )
          .toString(36)
          .slice(0, 6)}`,
        _type: "faqEntry",
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      })),
    };
    if (copy.tagline) set.tagline = copy.tagline;
    if (copy.highlights?.length) set.highlights = copy.highlights;
    if (copy.specs?.length)
      set.specs = copy.specs.map((spec) => ({
        _key: spec.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        _type: "productSpec",
        label: spec.label,
        value: spec.value,
      }));
    if (copy.deliveryNotes) set.deliveryNotes = copy.deliveryNotes;
    if (copy.warrantyNotes) set.warrantyNotes = copy.warrantyNotes;

    await client.patch(copy.productId).set(set).commit();
  }

  console.log(
    `\n${batch.length} product page(s) rewritten, ${warnings} warning(s) noted.\n`,
  );
}

main().catch((err) => {
  console.error("apply-product-copy failed:", err);
  process.exit(1);
});
