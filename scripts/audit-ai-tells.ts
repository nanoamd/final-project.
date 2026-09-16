/**
 * Where the writing reads as machine-generated.
 *
 * Damien: _"remove all traces of ai from them 9, and all pages, make them all
 * clearly human"_.
 *
 * This is ordinary copy-editing, not disguise: it is his site, his brief and
 * his byline, and prose that reads like a person wrote it is simply better
 * prose. Google has never penalised writing for how it was produced — it
 * penalises thin, samey, low-value pages, which is exactly what these tells
 * correlate with.
 *
 * Scans Sanity content and the tool pages in the repo for the markers that make
 * text read as generated, counts them, and names the worst offenders. It
 * changes nothing — a rewrite has to be read, and the point of this is to say
 * how much reading there is.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-ai-tells.ts
 */
import { readdirSync, readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/**
 * The markers, grouped by why they give the game away.
 *
 * Deliberately not a list of banned words. "Perfect for" is a real phrase a
 * human writes; it is the DENSITY that reads as generated, so the report counts
 * rather than flags.
 */
const TELLS: { group: string; label: string; re: RegExp }[] = [
  // The single most recognisable construction in generated copy.
  {
    group: "construction",
    label: "not just X, it's Y",
    re: /\bnot (just|merely|only)\b[^.?!]{0,60}\b(it'?s|but)\b/gi,
  },
  {
    group: "construction",
    label: "whether you're X or Y",
    re: /\bwhether you(?:'re| are)\b/gi,
  },
  {
    group: "construction",
    label: "when it comes to",
    re: /\bwhen it comes to\b/gi,
  },
  {
    group: "construction",
    label: "look no further",
    re: /\blook no further\b/gi,
  },
  {
    group: "construction",
    label: "more than just",
    re: /\bmore than just\b/gi,
  },
  {
    group: "construction",
    label: "a testament to",
    re: /\ba testament to\b/gi,
  },
  {
    group: "construction",
    label: "plays a X role",
    re: /\bplays? an? (crucial|vital|pivotal|key|important) role\b/gi,
  },
  {
    group: "construction",
    label: "at the end of the day",
    re: /\bat the end of the day\b/gi,
  },

  // Vocabulary that almost never appears in a person's product copy.
  {
    group: "vocabulary",
    label: "delve / dive into",
    re: /\b(delve|dives? into|diving into)\b/gi,
  },
  { group: "vocabulary", label: "elevate", re: /\belevat(e|es|ing|ed)\b/gi },
  {
    group: "vocabulary",
    label: "transform your space",
    re: /\btransform(s|ing)? (your|any|the) (space|home|room)\b/gi,
  },
  { group: "vocabulary", label: "curated", re: /\bcurat(ed|ion|ing)\b/gi },
  {
    group: "vocabulary",
    label: "seamless / effortless",
    re: /\b(seamless(ly)?|effortless(ly)?)\b/gi,
  },
  { group: "vocabulary", label: "boasts", re: /\bboasts?\b/gi },
  { group: "vocabulary", label: "nestled", re: /\bnestled\b/gi },
  { group: "vocabulary", label: "sparks joy", re: /\bspark(s|ing)? joy\b/gi },
  {
    group: "vocabulary",
    label: "breathe(s) life into",
    re: /\bbreathes? (new )?life into\b/gi,
  },
  {
    group: "vocabulary",
    label: "myriad / plethora",
    re: /\b(myriad|plethora)\b/gi,
  },
  {
    group: "vocabulary",
    label: "unlock / unleash",
    re: /\b(unlock|unleash)(s|ing|ed)?\b/gi,
  },
  { group: "vocabulary", label: "meticulous(ly)", re: /\bmeticulous(ly)?\b/gi },
  {
    group: "vocabulary",
    label: "timeless elegance",
    re: /\btimeless (elegance|appeal|beauty|charm)\b/gi,
  },
  {
    group: "vocabulary",
    label: "aesthetic (as noun)",
    re: /\byour (overall )?aesthetic\b/gi,
  },
  { group: "vocabulary", label: "ambiance / ambience", re: /\bambian?ce\b/gi },

  // Connectives a person rarely opens a sentence with, twice a paragraph.
  {
    group: "connectives",
    label: "Moreover / Furthermore",
    re: /\b(moreover|furthermore)\b/gi,
  },
  { group: "connectives", label: "Additionally", re: /\badditionally\b/gi },
  { group: "connectives", label: "In today's ...", re: /\bin today'?s\b/gi },
  {
    group: "connectives",
    label: "It's worth noting",
    re: /\bit'?s worth noting\b/gi,
  },
  { group: "connectives", label: "Rest assured", re: /\brest assured\b/gi },
  {
    group: "connectives",
    label: "Ensure / ensuring",
    re: /\bensur(e|es|ing)\b/gi,
  },
];

interface Doc {
  kind: string;
  id: string;
  text: string;
}

function blocksToText(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return body
    .map((b) => {
      const blk = b as { _type?: string; children?: { text?: string }[] };
      if (blk._type !== "block") return "";
      return (blk.children ?? []).map((c) => c.text ?? "").join("");
    })
    .join("\n");
}

async function main() {
  const docs: Doc[] = [];

  const products = await client.fetch<
    { slug: string; summary: string | null; description: unknown }[]
  >(`*[_type=="product" && !(_id in path("drafts.**"))]{
       "slug": slug.current, summary, description }`);
  for (const p of products)
    docs.push({
      kind: "product",
      id: p.slug,
      text: `${p.summary ?? ""}\n${blocksToText(p.description)}`,
    });

  for (const type of ["buyingGuide", "post", "category"]) {
    const rows = await client.fetch<
      { slug: string; body: unknown; intro?: unknown }[]
    >(
      `*[_type=="${type}" && !(_id in path("drafts.**"))]{
         "slug": slug.current, "body": coalesce(body, buyingGuide), "intro": description }`,
    );
    for (const r of rows)
      docs.push({
        kind: type,
        id: r.slug,
        text: `${typeof r.intro === "string" ? r.intro : ""}\n${blocksToText(r.body)}`,
      });
  }

  const toolsDir = "src/app/(site)/tools";
  for (const entry of readdirSync(toolsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    docs.push({
      kind: "toolPage",
      id: entry.name,
      text: readFileSync(`${toolsDir}/${entry.name}/page.tsx`, "utf8"),
    });
  }

  const byTell = new Map<string, number>();
  const byDoc = new Map<
    string,
    { kind: string; hits: number; worst: string[] }
  >();

  for (const d of docs) {
    let total = 0;
    const worst: string[] = [];
    for (const t of TELLS) {
      const n = (d.text.match(t.re) ?? []).length;
      if (!n) continue;
      total += n;
      byTell.set(t.label, (byTell.get(t.label) ?? 0) + n);
      worst.push(`${t.label}×${n}`);
    }
    if (total) byDoc.set(d.id, { kind: d.kind, hits: total, worst });
  }

  const words = docs.reduce((n, d) => n + d.text.split(/\s+/).length, 0);
  const hits = [...byTell.values()].reduce((a, b) => a + b, 0);
  console.log(`\n${docs.length} documents, ~${words.toLocaleString()} words`);
  console.log(`${hits} tells across ${byDoc.size} documents\n`);

  console.log("BY TELL\n");
  for (const [label, n] of [...byTell.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(5)}  ${label}`);

  const byKind = new Map<string, number>();
  for (const v of byDoc.values())
    byKind.set(v.kind, (byKind.get(v.kind) ?? 0) + v.hits);
  console.log("\nBY DOCUMENT TYPE\n");
  for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(5)}  ${k}`);

  console.log("\nWORST 20 DOCUMENTS\n");
  for (const [id, v] of [...byDoc.entries()]
    .sort((a, b) => b[1].hits - a[1].hits)
    .slice(0, 20))
    console.log(
      `  ${String(v.hits).padStart(3)}  ${v.kind.padEnd(12)} ${id.slice(0, 44).padEnd(46)} ${v.worst.slice(0, 3).join(", ")}`,
    );
  console.log("");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
