/**
 * Four meta titles that were wrong rather than too long, and four summaries the
 * de-marketing passes missed.
 *
 * The titles are the interesting ones, because nothing that measures length
 * would ever have caught them:
 *
 *   - "Contour Collection 3 Drawer Console" carried the meta title "Capri
 *     Outdoor Foot Stool | Wicker Garden Footrest | Kaiku". A different
 *     product's title entirely, presumably pasted, so the console has been
 *     going to Google as a footstool.
 *   - Two different lamps — the Spiral and the Geometric Mesh LED wall lights —
 *     both carried the generic "Led Wall Lamp 2 Pack | Lighting | Kaiku", so
 *     they competed with each other for one identical result.
 *
 * All four are under 60 characters and free of ellipses, which is why the
 * length-and-truncation pass in scripts/fix-product-meta.ts left them alone.
 * Rebuilt from each product's own title.
 *
 * The summaries carry "ideal for" and "perfect addition" — the last of the
 * supplier voice. Each is rewritten from the facts already in the sentence.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-last-meta-mismatches.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-last-meta-mismatches.ts --apply
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

const TITLES: { id: string; metaTitle: string }[] = [
  {
    id: "product-import-contour-collection-3-drawer-console",
    metaTitle: "Contour Collection 3 Drawer Console | Kaiku",
  },
  {
    id: "product-import-capri-collection-outdoor-foot-stool",
    metaTitle: "Capri Collection Outdoor Foot Stool | Kaiku",
  },
  {
    id: "product-aosom-b31-562v00gd",
    metaTitle: "Spiral LED Wall Lights, Set of 2, Gold | Kaiku",
  },
  {
    id: "product-aosom-b31-565v00gd",
    metaTitle: "Geometric Mesh LED Wall Lights, Set of 2, Gold | Kaiku",
  },
];

const SUMMARIES: { id: string; summary: string; meta: string }[] = [
  {
    id: "premier-housewares-1601835",
    summary:
      "Made from bamboo fibre, corn starch and mineral powder, so it is a plant-based composite rather than plastic. Wipe clean with a soft cloth and avoid abrasive cleaners.",
    meta: "Made from bamboo fibre, corn starch and mineral powder — a plant-based composite rather than plastic. Wipe clean.",
  },
  {
    id: "premier-housewares-2406244",
    summary:
      "A three-tier shelving unit with a light oak effect finish on a sturdy iron frame, 120 x 28 x 107cm. Shallow at 28cm deep, so it sits against a wall without narrowing a walkway.",
    meta: "A three-tier shelving unit, light oak effect on an iron frame, 120 x 28 x 107cm. Shallow enough to sit against a wall.",
  },
  {
    id: "premier-housewares-2406556",
    summary:
      "A one-drawer bedside table with a black MDF frame and a natural rattan drawer panel. One drawer for the things that live beside a bed, and an open shelf below it.",
    meta: "A one-drawer bedside table with a black MDF frame and a natural rattan drawer panel, with an open shelf below.",
  },
  {
    id: "premier-housewares-5511427",
    summary:
      "A three-tier chandelier in black iron with transparent glass shades. Hard-wired to a ceiling rose, so it needs a qualified electrician, and it needs the ceiling height to hang clear of anyone walking beneath it.",
    meta: "A three-tier chandelier in black iron with transparent glass shades. Hard-wired, so it needs a qualified electrician.",
  },
];

async function main() {
  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const item of TITLES) {
    const doc = await client.fetch<{
      title: string;
      seo?: { metaTitle?: string };
    } | null>(`*[_id == $id][0]{title,seo}`, { id: item.id });
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    results.push({
      id: item.id,
      productTitle: doc.title,
      field: "seo.metaTitle",
      was: doc.seo?.metaTitle,
      now: item.metaTitle,
      len: item.metaTitle.length,
    });
    if (apply) {
      transaction.patch(item.id, (p) =>
        p.set({ "seo.metaTitle": item.metaTitle }),
      );
      queued += 1;
    }
  }

  for (const item of SUMMARIES) {
    const doc = await client.fetch<{ summary?: string } | null>(
      `*[_id == $id][0]{summary}`,
      { id: item.id },
    );
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }
    results.push({
      id: item.id,
      field: "summary + seo.metaDescription",
      was: doc.summary,
      now: item.summary,
      metaLen: item.meta.length,
    });
    if (apply) {
      transaction.patch(item.id, (p) =>
        p.set({ summary: item.summary, "seo.metaDescription": item.meta }),
      );
      queued += 1;
    }
  }

  const bad = [
    ...TITLES.filter((t) => t.metaTitle.length > 60).map((t) => t.id),
    ...SUMMARIES.filter((s) => s.meta.length > 160 || s.meta.length < 70).map(
      (s) => s.id,
    ),
  ];
  console.log(`Meta titles corrected: ${TITLES.length}`);
  console.log(`Summaries rewritten:   ${SUMMARIES.length}`);
  console.log(`Out of length range:   ${bad.length} ${bad.join(", ")}`);
  for (const r of results) console.log(`  ${JSON.stringify(r).slice(0, 200)}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-last-meta-mismatches.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
