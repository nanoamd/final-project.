/**
 * The final four FAQ answers deferring to "the specifications".
 *
 * All four ask questions with real, useful answers grounded in the material
 * the product is actually made of — a floor lamp has no drop to adjust, and an
 * elm-wood dining chair with fabric cushions has well-understood storage and
 * care needs. None of that required the specification to spell it out.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-hedges-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-hedges-batch2.ts --apply
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

const CEBU_WINTER =
  "Bring it indoors or under cover for the winter. Elm is not a naturally durable timber like teak, so standing out through months of wet and frost is what opens joints and lifts a finish — a shed, garage or covered terrace is enough, and the chair is light enough to carry in.";

const CEBU_CUSHIONS =
  "Treat the cushions as non-washable unless a care label on them says otherwise. Vacuum them with a soft brush attachment, blot spills immediately rather than rubbing, and store them dry when the chair is not in use — damp is what makes a foam cushion smell.";

interface FaqFix {
  id: string;
  match: string;
  answer: string;
}

const FIXES: FaqFix[] = [
  {
    id: "premier-housewares-5511678",
    match: "drop or cable length",
    answer:
      "There is no drop to set — this is a floor lamp, so it stands on the floor rather than hanging from a ceiling. Run the cable along the skirting rather than across open floor, and keep the lamp out of the main walking line through the room.",
  },
  {
    id: "premier-housewares-5529698",
    match: "store the chair during winter",
    answer: CEBU_WINTER,
  },
  {
    id: "premier-housewares-5529698",
    match: "care instructions for the cushions",
    answer: CEBU_CUSHIONS,
  },
  {
    id: "premier-housewares-5529699",
    match: "store the chair during winter",
    answer: CEBU_WINTER,
  },
];

interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
}

async function main() {
  const results: {
    id: string;
    ok: boolean;
    before?: string;
    after?: string;
  }[] = [];
  const transaction = client.transaction();
  const byId = new Map<string, Faq[]>();

  // Group so two edits on the same document commit as one patch.
  for (const fix of FIXES) {
    if (!byId.has(fix.id)) {
      const doc = await client.fetch<{ faqs: Faq[] } | null>(
        `*[_id == $id][0]{faqs}`,
        { id: fix.id },
      );
      byId.set(fix.id, doc?.faqs ?? []);
    }
    const faqs = byId.get(fix.id)!;
    let hit = false;
    const next = faqs.map((f) => {
      if (hit) return f;
      if (!(f.question ?? "").toLowerCase().includes(fix.match.toLowerCase()))
        return f;
      hit = true;
      results.push({
        id: fix.id,
        ok: true,
        before: f.answer ?? "",
        after: fix.answer,
      });
      return { ...f, answer: fix.answer };
    });
    if (!hit) {
      results.push({ id: fix.id, ok: false });
      console.error(`MISS ${fix.id}: no question matched "${fix.match}"`);
      continue;
    }
    byId.set(fix.id, next);
  }

  let queued = 0;
  for (const [id, faqs] of byId) {
    if (apply) {
      transaction.patch(id, (p) => p.set({ faqs }));
      queued += 1;
    }
  }

  for (const r of results.filter((x) => x.ok)) {
    console.log(`\n${r.id}`);
    console.log(`  was: ${r.before}`);
    console.log(`  now: ${r.after}`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-meta-hedges-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
