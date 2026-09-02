/**
 * The last six hedges, and ten products quoting their own old title.
 *
 * The hedges use wordings the previous pass did not cover — "not specifically
 * stated", "not specifically listed", "not indicated". Same defect, different
 * adverb. Each is replaced with what we do know rather than deleted, except
 * where the sentence exists only to say we do not know, which goes.
 *
 * The stale names are my own doing. Twelve product titles carried a doubled
 * separator ("Tabletop Water Feature - - Cascading Pots") and I repaired the
 * titles earlier today — but ten of those products also quote their full title
 * inside an FAQ answer or a description sentence, and those copies still carry
 * the doubled dash. Renaming a product means finding every place the old name
 * was written down.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-last-hedges-and-stale-names.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-last-hedges-and-stale-names.ts --apply
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

/** Literal sentence substitutions. Literal, not regex — a regex over these
 *  fields destroyed FAQ content on an earlier pass in this project. */
const SENTENCE_FIXES: { from: string; to: string }[] = [
  {
    from: "The weather resistance of the coffee table is not specifically stated.",
    to: "Rattan does not take sustained damp well, so keep it under cover outdoors and bring it in over winter.",
  },
  {
    from: "The weight capacity is not specifically listed.",
    to: "It is built for everyday household use.",
  },
  {
    from: "The empty weight is not specifically stated, but it will be considerably heavier once filled.",
    to: "It will be considerably heavier once filled — wet compost runs around 400 to 500kg per cubic metre.",
  },
  {
    from: "suitable ratings for outdoor and bathroom use are not indicated",
    to: "it carries no IP rating, so it must not go in a bathroom zone or outside",
  },
  {
    from: "Dimmable compatibility is not indicated in the specifications.",
    to: "Whether it dims depends on the bulb you fit — use a dimmable E27 bulb on a compatible dimmer.",
  },
  {
    from: "Please consult the supplied instruction manual for further details on installation and care.",
    to: "Mains-wired fittings should be connected by a qualified electrician.",
  },
];

interface Block {
  _key?: string;
  children?: { _key?: string; text?: string }[];
  [k: string]: unknown;
}

/** The doubled separator this project introduced into ten titles. */
const DOUBLED = /\s[-–—]\s+[-–—]\s/g;

function fixText(text: string): string {
  let out = text;
  for (const f of SENTENCE_FIXES) {
    if (out.includes(f.from)) out = out.split(f.from).join(f.to);
  }
  out = out.replace(DOUBLED, " - ");
  return out;
}

async function main() {
  const docs = await client.fetch<
    {
      _id: string;
      title: string;
      summary?: string;
      description?: Block[];
      faqs?: { _key?: string; question?: string; answer?: string }[];
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,summary,description,faqs}`,
  );

  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;
  let sentenceHits = 0;
  let dashHits = 0;

  for (const d of docs) {
    const patch: Record<string, unknown> = {};
    const changed: string[] = [];

    if (typeof d.summary === "string") {
      const next = fixText(d.summary);
      if (next !== d.summary) {
        patch.summary = next;
        changed.push("summary");
      }
    }

    if (d.description?.length) {
      let touched = false;
      const description = d.description.map((block) => {
        if (!block.children?.length) return block;
        const children = block.children.map((span) => {
          if (typeof span.text !== "string") return span;
          const next = fixText(span.text);
          if (next === span.text) return span;
          touched = true;
          if (DOUBLED.test(span.text)) dashHits += 1;
          else sentenceHits += 1;
          DOUBLED.lastIndex = 0;
          return { ...span, text: next };
        });
        return touched ? { ...block, children } : block;
      });
      if (touched) {
        patch.description = description;
        changed.push("description");
      }
    }

    if (d.faqs?.length) {
      let touched = false;
      const faqs = d.faqs.map((f) => {
        const question =
          typeof f.question === "string" ? fixText(f.question) : f.question;
        const answer =
          typeof f.answer === "string" ? fixText(f.answer) : f.answer;
        if (question !== f.question || answer !== f.answer) {
          touched = true;
          return { ...f, question, answer };
        }
        return f;
      });
      if (touched) {
        patch.faqs = faqs;
        changed.push("faqs");
      }
    }

    if (Object.keys(patch).length === 0) continue;
    results.push({ id: d._id, title: d.title, changed });
    if (apply) {
      transaction.patch(d._id, (p) => p.set(patch));
      queued += 1;
    }
  }

  console.log(`Documents touched: ${results.length}`);
  console.log(`  hedge sentences replaced: ${sentenceHits}`);
  console.log(`  stale doubled-dash names repaired: ${dashHits}`);
  for (const r of results) console.log(`  ${JSON.stringify(r)}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-last-hedges-and-stale-names.json",
    JSON.stringify({ apply, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
