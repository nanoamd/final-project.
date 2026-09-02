/**
 * The tail of the meta clean-up, plus four small content defects.
 *
 * scripts/fix-product-meta.ts left 89 descriptions alone because their summary
 * could not produce 70 characters, and 70 was my own floor for a "good" meta
 * description. That floor was the wrong call here: what those 89 kept instead
 * was supplier filler — "a perfect addition for charming home ambience" — and a
 * short honest line is better than a long empty one. Google shows what it shows.
 *
 * Also fixes, from the same audit:
 *   - Two FAQ questions beginning "s " where an "I" was eaten: "s it suitable
 *     for boutique hotels?" and "s the Hampton Octagonal Mirror made from real
 *     shagreen?".
 *   - Two products with no FAQs at all.
 *   - One product with duplicate spec labels.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-remainder-and-faqs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-meta-remainder-and-faqs.ts --apply
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

const DESC_LIMIT = 160;

const FILLER = [
  /\bShop the\b/i,
  /\bDiscover our\b/i,
  /\bDiscover the\b/i,
  /\bExplore our\b/i,
  /\bperfect addition\b/i,
  /\bPremium UK homewares for modern interiors\b/i,
  /\bfor a touch of\b/i,
  /\benhance your\b/i,
  /\bavailable at Kaiku\b/i,
  /\bFree UK delivery available\b/i,
  /\bideal for\b/i,
  /\belevate your\b/i,
  /\bstylish and\b/i,
];

/** Whole sentences from the summary, up to the limit, with no minimum. */
function describeFrom(summary: string): string | null {
  const clean = summary.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= DESC_LIMIT) return clean;

  let out = "";
  for (const sentence of clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > DESC_LIMIT) break;
    out = next;
  }
  if (out) return out;

  const cut = clean.slice(0, DESC_LIMIT - 1);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace <= 0) return null;
  return `${cut.slice(0, lastSpace).replace(/[,;:]$/, "")}…`;
}

/** The two eaten-"I" questions, matched literally so nothing else can be hit. */
const QUESTION_FIXES: { id: string; from: string; to: string }[] = [
  {
    id: "product-import-grafton-1-drawer-black-bedside-table",
    from: "s it suitable for boutique hotels? ",
    to: "Is it suitable for boutique hotels?",
  },
  {
    id: "product-import-hampton-ivory-octagonal-mirror",
    from: "s the Hampton Octagonal Mirror made from real shagreen? ",
    to: "Is the Hampton Octagonal Mirror made from real shagreen?",
  },
];

/**
 * FAQs for the two products that had none, written from their own specs and
 * description — the solar lantern's charging behaviour and the resin table's
 * outdoor tolerance are the two things a customer actually asks about each.
 */
const NEW_FAQS: {
  id: string;
  faqs: [question: string, answer: string][];
}[] = [
  {
    id: "product-aosom-867-154v00gy",
    faqs: [
      [
        "Does it need wiring or a plug?",
        "No. It is solar, so there is no cable and no socket needed — the panel charges the battery during the day and the lantern comes on at dusk.",
      ],
      [
        "How much sun does it need?",
        "About six hours of direct light on the panel to fill the battery. In the shade of a hedge or a fence it will run for a much shorter time, so site the panel for the sun.",
      ],
      [
        "How long does it stay lit?",
        "A full summer charge runs through the evening. On a grey December day expect a couple of hours rather than all night — that is the daylight available, not a fault.",
      ],
      [
        "Can it stay outside all year?",
        "Yes, it is made for outdoor use. Bring it under cover in prolonged hard frost if you can, and wipe the solar panel clear of leaves and grime, which is the usual reason one stops performing.",
      ],
    ],
  },
  {
    id: "product-aw-rwa-01",
    faqs: [
      [
        "Is every table the same?",
        "No. The tamarind is solid timber and the resin is poured by hand, so the grain, the edge profile and the way the aqua resin sits in the wood are different on every piece.",
      ],
      [
        "Can I use it outdoors?",
        "It is made as an indoor table. Sustained sun will fade the resin and rain will move the timber, so keep it inside or under permanent cover.",
      ],
      [
        "How do I look after the resin?",
        "Wipe it with a soft damp cloth and dry it off. Avoid abrasive creams and scouring pads, which dull the polished surface, and stand hot dishes on a mat.",
      ],
      [
        "Does it arrive assembled?",
        "Yes. It is a solid piece rather than a flat pack — check the carton dimensions on this page against your doorways and stair turns before delivery.",
      ],
    ],
  },
];

async function main() {
  const results: Record<string, unknown>[] = [];
  let transaction = client.transaction();
  let queued = 0;
  let committed = 0;

  // 1. The 89 descriptions still carrying filler.
  const products = await client.fetch<
    {
      _id: string;
      title: string;
      summary?: string;
      seo?: { metaDescription?: string };
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id,title,summary,seo}`,
  );
  let descFixes = 0;
  for (const p of products) {
    const current = p.seo?.metaDescription?.trim() ?? "";
    if (!current || !FILLER.some((re) => re.test(current))) continue;
    const rebuilt = describeFrom(p.summary ?? "");
    if (!rebuilt || rebuilt === current) {
      console.error(`NO SUMMARY TO USE: ${p._id} — ${p.title}`);
      continue;
    }
    results.push({
      id: p._id,
      field: "seo.metaDescription",
      was: current,
      now: rebuilt,
      len: rebuilt.length,
    });
    descFixes += 1;
    if (apply) {
      transaction.patch(p._id, (patcher) =>
        patcher.set({ "seo.metaDescription": rebuilt }),
      );
      queued += 1;
      if (queued >= 100) {
        await transaction.commit();
        committed += queued;
        queued = 0;
        transaction = client.transaction();
      }
    }
  }

  // 2. The two eaten-"I" questions. Literal substitution on the exact string —
  //    a regex here is what destroyed FAQ content on an earlier pass.
  let questionFixes = 0;
  for (const fix of QUESTION_FIXES) {
    const doc = await client.fetch<{
      faqs?: { _key?: string; question?: string }[];
    } | null>(`*[_id == $id][0]{faqs}`, { id: fix.id });
    if (!doc?.faqs) {
      console.error(`NOT FOUND: ${fix.id}`);
      continue;
    }
    const index = doc.faqs.findIndex((f) => f.question === fix.from);
    if (index < 0) {
      console.error(`QUESTION NOT MATCHED on ${fix.id}: ${fix.from}`);
      continue;
    }
    results.push({
      id: fix.id,
      field: `faqs[${index}].question`,
      was: fix.from,
      now: fix.to,
    });
    questionFixes += 1;
    if (apply) {
      transaction.patch(fix.id, (patcher) =>
        patcher.set({ [`faqs[${index}].question`]: fix.to }),
      );
      queued += 1;
    }
  }

  // 3. The two products with no FAQs.
  let faqSets = 0;
  for (const item of NEW_FAQS) {
    const doc = await client.fetch<{ faqs?: unknown[] } | null>(
      `*[_id == $id][0]{faqs}`,
      { id: item.id },
    );
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    if (doc.faqs?.length) {
      console.log(`Already has FAQs, skipping: ${item.id}`);
      continue;
    }
    const faqs = item.faqs.map(([question, answer], i) => ({
      _key: `f${i}`,
      _type: "faqEntry",
      question,
      answer,
    }));
    results.push({ id: item.id, field: "faqs", now: `${faqs.length} added` });
    faqSets += 1;
    if (apply) {
      transaction.patch(item.id, (patcher) => patcher.set({ faqs }));
      queued += 1;
    }
  }

  // 4. Duplicate spec labels — de-duplicated by keeping the first of each label,
  //    but only where the duplicated rows agree. Where they disagree the data is
  //    contradictory and needs a human, so it is reported and left.
  const dupes = await client.fetch<
    {
      _id: string;
      title: string;
      specs?: { label?: string; value?: string }[];
    }[]
  >(
    `*[_type=="product" && !(_id in path("drafts.**")) && count(specs) > count(array::unique(specs[].label))]{_id,title,specs}`,
  );
  let specFixes = 0;
  for (const p of dupes) {
    const specs = p.specs ?? [];
    const seen = new Map<string, string>();
    let contradictory = false;
    for (const s of specs) {
      const key = (s.label ?? "").trim().toLowerCase();
      const value = (s.value ?? "").trim();
      const prior = seen.get(key);
      if (prior !== undefined && prior !== value) contradictory = true;
      if (prior === undefined) seen.set(key, value);
    }
    if (contradictory) {
      console.error(
        `CONTRADICTORY SPECS, left for you: ${p._id} — ${p.title}\n  ${JSON.stringify(specs)}`,
      );
      results.push({ id: p._id, field: "specs", note: "contradictory, left" });
      continue;
    }
    const kept: string[] = [];
    const deduped = specs.filter((s) => {
      const key = (s.label ?? "").trim().toLowerCase();
      if (kept.includes(key)) return false;
      kept.push(key);
      return true;
    });
    results.push({
      id: p._id,
      field: "specs",
      was: `${specs.length} rows`,
      now: `${deduped.length} rows`,
    });
    specFixes += 1;
    if (apply) {
      transaction.patch(p._id, (patcher) => patcher.set({ specs: deduped }));
      queued += 1;
    }
  }

  console.log(`\nMeta descriptions rebuilt: ${descFixes}`);
  console.log(`FAQ questions repaired:    ${questionFixes}`);
  console.log(`FAQ sets added:            ${faqSets}`);
  console.log(`Spec lists de-duplicated:  ${specFixes}`);

  const over = results.filter(
    (r) => typeof r.len === "number" && r.len > DESC_LIMIT,
  );
  console.log(`Descriptions over 160 chars: ${over.length}`);

  console.log("\nSample:");
  for (const r of results.slice(0, 3)) console.log(`  ${JSON.stringify(r)}`);

  if (apply) {
    if (queued > 0) {
      await transaction.commit();
      committed += queued;
    }
    console.log(`\nApplied: ${committed} patches.`);
  } else {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-meta-remainder-and-faqs.json",
    JSON.stringify({ apply, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
