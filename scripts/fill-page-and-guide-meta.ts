/**
 * Meta titles and descriptions for the last 15 documents that had none.
 *
 * Six buying guides, eight pages and one blog post. Every category, room and
 * product already carries both; these were the remainder, and they were falling
 * back to the site default template — so eight legal and service pages, six
 * guides written to rank for a specific question, and the one blog post were all
 * going to search under a generic title.
 *
 * The guides are the ones that matter commercially: each is written to answer a
 * question people actually type ("what size planter do I need"), and the meta
 * title is that question, because matching the query is the whole point of the
 * page. The descriptions lead with the answer rather than teasing it — a
 * searcher who gets the number in the result and clicks anyway is the one who
 * wanted the detail.
 *
 * Every title is 60 characters or fewer and every description 70 to 160, checked
 * by the script before it writes.
 *
 *   pnpm tsx --env-file=.env.local scripts/fill-page-and-guide-meta.ts
 *   pnpm tsx --env-file=.env.local scripts/fill-page-and-guide-meta.ts --apply
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

const META: { id: string; metaTitle: string; metaDescription: string }[] = [
  // --- Buying guides: the meta title is the question the page answers. ---
  {
    id: "buying-guide-choosing-a-planter",
    metaTitle: "What Size Planter Do You Need? | Kaiku",
    metaDescription:
      "Step up 2–4cm for a small plant and 5–10cm for a large one, never more. Pot sizes, compost volumes and the nursery pot each planter takes.",
  },
  {
    id: "buying-guide-choosing-a-vase-for-what-you-put-in-it",
    metaTitle: "What Size Vase for Your Flowers? | Kaiku",
    metaDescription:
      "A vase should be half to two-thirds the height of the arrangement — 30cm of vase to stems bought at 50–70cm. Stem counts by neck width.",
  },
  {
    id: "buying-guide-garden-furniture-british-winter",
    metaTitle: "What Garden Furniture Can Stay Out All Winter? | Kaiku",
    metaDescription:
      "Teak, powder-coated aluminium and rattan on an aluminium frame need nothing. Everything soft comes in by the end of October. The full table.",
  },
  {
    id: "buying-guide-how-many-lights-does-a-room-need",
    metaTitle: "How Many Lights Does a Room Need? | Kaiku",
    metaDescription:
      "Three sources at three heights, and 100–150 lumens per square metre in a living room. The figures by room, and which layer each light serves.",
  },
  {
    id: "buying-guide-where-to-hang-a-wall-clock",
    metaTitle: "What Size Wall Clock, and Where to Hang It | Kaiku",
    metaDescription:
      "Two-thirds the width of the furniture beneath it, centred 150–170cm from the floor. Sizes by room, and our own clocks measured against them.",
  },
  {
    id: "buyingGuide-choosing-a-sauna",
    metaTitle: "Barrel vs Cabin Sauna: How to Choose | Kaiku",
    metaDescription:
      "The real trade-offs between barrel and cabin saunas, electric against wood-burning heaters, and what a UK installation actually requires.",
  },
  // --- Pages. ---
  {
    id: "page-about",
    metaTitle: "About Kaiku",
    metaDescription:
      "Why Kaiku exists: premium home, garden and wellness pieces chosen for how well they are made rather than how well they photograph.",
  },
  {
    id: "page-contact",
    metaTitle: "Contact Kaiku",
    metaDescription:
      "Get in touch about an order, a product or a delivery. Support is not outsourced, so you are always speaking to someone who knows the range.",
  },
  {
    id: "page-delivery",
    metaTitle: "Delivery | Kaiku",
    metaDescription:
      "Where we deliver, how long each piece takes and what happens on the day. UK-wide delivery, with timings shown on every product page.",
  },
  {
    id: "page-returns",
    metaTitle: "Returns & Refunds | Kaiku",
    metaDescription:
      "Cancel within 14 days of receiving your order under UK consumer law. What to send back, how to send it, and when the refund is processed.",
  },
  {
    id: "page-warranty",
    metaTitle: "Warranty | Kaiku",
    metaDescription:
      "What is covered, for how long, and how to make a claim. Your statutory rights under UK consumer law are unaffected by any warranty here.",
  },
  {
    id: "page-privacy",
    metaTitle: "Privacy Policy | Kaiku",
    metaDescription:
      "What personal information Kaiku collects, why it is collected, how long it is kept and the rights you have over it under UK data protection law.",
  },
  {
    id: "page-cookies",
    metaTitle: "Cookie Policy | Kaiku",
    metaDescription:
      "The cookies Kaiku uses and what each one does — signing you in, remembering your basket, measuring how the site is used, and personalisation.",
  },
  {
    id: "page-terms",
    metaTitle: "Terms & Conditions | Kaiku",
    metaDescription:
      "The terms you agree to when ordering from Kaiku: pricing, payment, delivery, cancellation and liability, alongside your statutory rights.",
  },
  // --- Blog. ---
  {
    id: "post-sauna-ritual",
    metaTitle: "Building a Weekly Sauna Ritual That Sticks | Kaiku",
    metaDescription:
      "How often to use a sauna, how long a session should run, and the practical changes that turn an expensive cabin into a weekly habit.",
  },
];

async function main() {
  // Refuse to write anything if a single line is out of range — a truncated
  // title in a search result is the defect this whole pass exists to remove.
  const bad = META.filter(
    (m) =>
      m.metaTitle.length > 60 ||
      m.metaDescription.length > 160 ||
      m.metaDescription.length < 70,
  );
  if (bad.length) {
    for (const b of bad)
      console.error(
        `OUT OF RANGE: ${b.id} title=${b.metaTitle.length} desc=${b.metaDescription.length}`,
      );
    process.exit(1);
  }

  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const item of META) {
    const doc = await client.fetch<{
      _type: string;
      title?: string;
      seo?: { metaTitle?: string; metaDescription?: string };
    } | null>(`*[_id == $id][0]{_type,title,seo}`, { id: item.id });
    if (!doc) {
      console.error(`NOT FOUND: ${item.id}`);
      continue;
    }

    // Never overwrite a value an editor has already put in.
    const patch: Record<string, unknown> = {};
    if (!doc.seo?.metaTitle?.trim()) patch["seo.metaTitle"] = item.metaTitle;
    if (!doc.seo?.metaDescription?.trim())
      patch["seo.metaDescription"] = item.metaDescription;

    results.push({
      id: item.id,
      type: doc._type,
      title: doc.title,
      wrote: Object.keys(patch),
      titleLen: item.metaTitle.length,
      descLen: item.metaDescription.length,
    });

    if (Object.keys(patch).length === 0) continue;
    if (apply) {
      transaction.patch(item.id, (p) => p.set(patch));
      queued += 1;
    }
  }

  for (const r of results) console.log(JSON.stringify(r));
  console.log(
    `\nAll ${META.length} titles <= 60 chars and descriptions 70-160 chars.`,
  );

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fill-page-and-guide-meta.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
