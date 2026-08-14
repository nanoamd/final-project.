/**
 * The meta description audit, and the repair.
 *
 * A meta description does not rank a page. It decides whether the person who has
 * already found the page clicks it, which on a domain fighting for every visit is
 * the cheapest conversion there is. The audit found four separate faults, and one
 * of them is embarrassing.
 *
 * **1. Ninety of 98 product descriptions are over 160 characters**, which is where
 * Google stops rendering them. Every one of those pages is paying for copy the
 * searcher never sees, and in most cases the sentence that got cut is the one
 * naming the material.
 *
 * **2. A leaked prompt is live on a £300 product.** The Abberley White End Table's
 * meta description is 352 characters and ends: *"Once you send the product page
 * screenshot, I'll generate the full SEO page with the official dimensions,
 * specifications, FAQs, delivery, returns and warranty."* That is chat output pasted
 * into a shipping field. `scripts/strip-copy-artefacts.ts` cleaned the descriptions
 * and never looked at the SEO fields.
 *
 * **3. Trade language throughout.** "boutique hotels", "designer interiors",
 * "luxury interior projects" — the exact phrases `BANNED_PHRASES` exists to catch,
 * because they are written for a buyer at a trade show and not for the person
 * furnishing one room. The validator was applied to product copy and never to the
 * SEO object.
 *
 * **4. Forty-three category pages, and forty with no meta description at all.**
 * Thirty of those hold products and are in the sitemap, so they are being submitted
 * for indexing with whatever the site's default template produces.
 *
 * **What this does about it, and what it deliberately does not.**
 *
 * For products it is surgical where it can be. The existing copy was written by a
 * person and much of its first sentence is good, so each description is *cleaned and
 * fitted*: sentences carrying a banned phrase or a chat artefact are dropped, and the
 * rest are kept while they fit. Whole sentences only — cutting one to length was
 * tried and produced "…and timeless rustic character for stylish." A product whose
 * description already fits and reads cleanly is not touched at all.
 *
 * That salvages 54 of them. The other 39 are **written out by hand** in
 * `HAND_WRITTEN` below, from the measurement, the material and one clause about who
 * the piece suits — because the alternative was publishing a fragment.
 *
 * For categories with introduction copy, the description comes from that copy — it
 * was written for the page and it is already in the house voice.
 *
 * For stocked categories with no copy at all, it is built from what the catalogue
 * can prove: how many pieces the category holds and two of them by name. That is
 * more use to a searcher than the default template, and every word of it is true.
 * Unstocked categories are left alone, because they are not in the sitemap and a
 * description for an empty page is work with nowhere to land.
 *
 * Meta *titles* are reported and not rewritten. 62 products carry one over 60
 * characters, which Google may truncate — but the title pattern is signed off in the
 * brief, the names must not change, and trimming a keyword phrase to satisfy a
 * guideline that Google actually applies in pixels rather than characters is not
 * obviously an improvement. The report is there to be overruled.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-meta.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-meta.ts --apply
 */
import { createClient } from "@sanity/client";

import { BANNED_NAMES, BANNED_PHRASES } from "./lib/product-copy";

const apply = process.argv.includes("--apply");
/** Replace a description this script generated earlier, when the generator improves. */
const force = process.argv.includes("--force");

/**
 * The shape of a description this script built from the catalogue.
 *
 * Used to tell its own output apart from copy a person wrote, so `--force` can fix a
 * generator bug — the first run published "One TV units at Kaiku" — without
 * overwriting anything hand-written.
 */
const GENERATED = / at Kaiku(,| —)|Delivered across the UK\.$/;

/**
 * Built on demand rather than at import time, so the pure functions below can be
 * imported by the test without the module aborting for want of a token.
 */
function sanity() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
    process.exit(1);
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
  });
}

/** Where Google stops rendering a description. */
export const MAX_DESCRIPTION = 158;
/** Below this there is not enough of a sentence to be worth showing. */
export const MIN_DESCRIPTION = 70;
/** Guideline only, and reported rather than enforced. */
export const MAX_TITLE = 60;

/** Tells that text came out of a chat window rather than a copywriter. */
const ARTEFACT =
  /\b(I'?ll|I will|I can) (generate|create|write|produce)\b|\bonce you (send|share|upload)\b|\bas an AI\b|\bhere'?s the\b|\blet me know\b|\bplaceholder\b|\b(TODO|FIXME|TBC)\b/i;

/**
 * Splits into sentences without breaking on the decimal in "35.5cm" or on an
 * abbreviation.
 *
 * A regex on `.` alone cuts "120 × 80 × 35.5cm" in half and produces a description
 * ending mid-measurement, which is worse than the length problem being fixed.
 */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z£0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function hasBannedPhrase(text: string): boolean {
  return (
    BANNED_PHRASES.some(([pattern]) => pattern.test(text)) ||
    BANNED_NAMES.some(([pattern]) => pattern.test(text))
  );
}

/**
 * Cleans and fits an existing description.
 *
 * Returns null when the input is already fine, so a product that needs nothing is
 * never rewritten and never re-published.
 */
export function fitDescription(existing: string): string | null {
  const original = existing.replace(/\s+/g, " ").trim();
  const keepable = sentences(original).filter(
    (sentence) => !ARTEFACT.test(sentence) && !hasBannedPhrase(sentence),
  );
  if (!keepable.length) return null;

  let fitted = "";
  for (const sentence of keepable) {
    const candidate = fitted ? `${fitted} ${sentence}` : sentence;
    if (candidate.length > MAX_DESCRIPTION) break;
    fitted = candidate;
  }

  // Whole sentences only. Cutting one to fit was tried and abandoned: the clause
  // boundaries in this copy do not fall where a sentence ends, so it produced
  // "…and timeless rustic character for stylish." on the recycled wood chest. A
  // product whose surviving sentences do not reach the minimum is reported for
  // hand-writing instead, and HAND_WRITTEN below is where that lands.
  if (fitted.length < MIN_DESCRIPTION) return null;
  return fitted === original ? null : fitted;
}

/**
 * The 39 products whose existing description could not be salvaged, written out.
 *
 * These are the ones where every surviving sentence was trade language, or where the
 * copy is one sentence so long that nothing usable is left inside 158 characters.
 * Cutting a sentence to fit was tried and abandoned — see the note in
 * `fitDescription` — so these are written from the specifications instead: the
 * measurement, the material, and one clause saying who the piece suits. Nothing here
 * claims anything the documents cannot prove, and no lead time or price is quoted,
 * because a meta description is the last place anybody remembers to update.
 */
const HAND_WRITTEN: Record<string, string> = {
  "4-drawer-recycled-wood-storage-chest":
    "Reclaimed teak chest with four drawers, 52cm wide and 77cm tall. Every board has had a previous life, so the grain and the nail holes are its own.",
  "abberley-coffee-table-brown":
    "Solid oak frame, tempered glass top and a lower shelf for books. 110 × 50cm and 40cm high, which suits the seat height of most upholstered sofas.",
  "abberley-one-drawer-black-console-table":
    "Black oak console just 30cm deep, so a narrow hallway keeps its walkway. 120cm long, 85cm high, with one drawer.",
  "abberley-white-chest-of-drawers":
    "Three-drawer chest in solid oak with a white painted finish. 90cm wide, 45cm deep and 85cm high — the depth that takes folded bedding flat.",
  "alton-white-chest-of-drawers":
    "Birch three-drawer chest in white, 90 × 45cm and 75cm high. The lowest chest in the range, which suits a smaller bedroom.",
  "axis-putty-grey-carver-dining-chair":
    "Carver dining chair in putty grey, with arms. 54cm wide, 51cm deep and 79cm to the top of the back.",
  "bentley-coffee-table-oak":
    "Square oak coffee table, 120 × 120cm and 45cm high. A square reads correctly from two directions, which is what a corner sofa needs.",
  "brown-wooden-storage-crates-set-of-3":
    "Three stacking wooden crates in brown, the largest 45 × 30cm. For a kitchen shelf, a hallway, or under a bench.",
  "camden-round-side-table":
    "Round side table, 45cm across and 60cm high, which sits level with the arm of most armchairs.",
  "chilworth-grey-bedside-table":
    "Grey bedside table 35cm square — the narrowest we sell, for a tight gap between the bed and the wall. 60cm high, with one drawer.",
  "crofton-white-marble-coffee-table":
    "Square coffee table with a white marble top, 100 × 100cm and 37cm high. Low enough for a deep sofa with a soft seat.",
  "elmley-grey-end-table":
    "End table in grey faux shagreen with a glass top and a metal frame, 45cm square and 60cm high.",
  "grafton-black-chest-of-drawers":
    "Three-drawer chest in oak on a black metal frame. 90cm wide, 50cm deep and 85cm high.",
  "grafton-black-end-table":
    "Slim black metal end table, 50 × 32cm and 60cm high. Narrow enough for the gap between an armchair and a wall.",
  "hampton-ivory-shagreen-chest-of-drawers":
    "Three-drawer chest wrapped in ivory faux shagreen, on metal runners. 90 × 45cm and 85cm high.",
  "hampton-ivory-shagreen-nest-of-tables":
    "Two nesting tables in ivory faux shagreen, 39cm square and 54cm high. They stack into one footprint when the room is quiet.",
  "hampton-ivory-shagreen-tv-unit":
    "Media console in ivory faux shagreen, 160cm long and 55cm high — low enough to put a large screen at a seated eye level.",
  "himbleton-green-3-seater-sofa":
    "Green chenille three-seater, 218cm long and 88cm deep. Measure your narrowest doorway on the diagonal before ordering.",
  "large-brown-wooden-storage-tub":
    "Reclaimed wood storage tub, 45cm across and 32cm tall. For logs beside a stove, blankets, or the things a hallway collects.",
  "large-reclaimed-wood-coffee-table":
    "Recycled teak coffee table, 122 × 61cm and 41cm high. Solid boards throughout, so the grain and the marks belong to this one.",
  "large-ribbed-gesso-table-lamp":
    "Ribbed gesso table lamp, 81cm tall with a 41cm shade. Right for a hallway console, and too tall for a bedside table.",
  "leckford-ribbed-black-oak-occasional-table":
    "Round ribbed oak occasional table in black, 75cm across and 76cm high — tall enough to serve a high-armed wing chair.",
  "mickleton-cream-chenille-armchair":
    "Cream chenille armchair, 66cm wide and 79cm high. It clears a standard doorway without being turned, which a three-seater will not.",
  "natural-teak-log-shelf-display-3-tier-100cm":
    "Three-tier teak display shelf, 100cm tall on a 27 × 23cm footprint. Cut from reclaimed timber, so no two are the same.",
  "neatham-end-table":
    "End table with a faux concrete top and slim brass legs, 40cm square and 60cm high. One finish, exactly as photographed.",
  "overbury-coffee-table-chocolate-brown":
    "Chocolate brown coffee table, 110 × 80cm and 38cm high — the length that suits a two-seater without closing in the walkway.",
  "pershore-rectangular-aged-oak-coffee-table":
    "Coffee table with an aged oak top on a sculptural black metal base, 110 × 80cm and 40cm high.",
  "reclaimed-teak-dining-table-180cm":
    "Reclaimed teak dining table, 180cm long and 77cm across. Every board has had a previous life, so the grain and the colour are its own.",
  "rutland-side-table":
    "Turned-leg side table, 60cm across and 60cm high, with a lower shelf for books.",
  "saunaplunge-bronte-2-person-outdoor-cabin-sauna":
    "Two-person outdoor cabin sauna in thermo-treated wood, 1.1 × 1.2m and 2m tall. Built as a garden structure rather than an appliance.",
  "saunaplunge-yorkshire-cabin-4-person-outdoor-infrared-sauna":
    "Four-person outdoor infrared sauna in thermo-treated spruce, 1.8 × 1.2m and 2m tall. Check the access to your garden before ordering.",
  "serene-one-drawer-side-table":
    "Side table with one drawer, 48cm wide and 59cm high — level with the arm of most armchairs.",
  "serene-rattan-side-table":
    "Side table with woven rattan detailing, 60cm across and 60cm high. Open enough not to fill a small sitting room.",
  "serene-three-drawer-bedside-table":
    "Bedside table with three drawers, 48cm wide and 59cm high, which suits a mattress top between 55cm and 65cm.",
  "small-rectangular-gesso-table-lamp":
    "Rectangular gesso table lamp, 55cm tall with a 31cm shade — the right height beside a bed rather than on a hallway console.",
  "tall-reclaimed-teak-chest-5-drawers":
    "Reclaimed teak chest of five drawers, 110cm tall on a 48 × 40cm footprint. Storage for a wall with no width to spare.",
  "tamarind-resin-coffee-table-aqua":
    "Coffee table cut from a tamarind slab and set with aqua resin, 47 × 46cm. One of a kind, because the slab decides the shape.",
  "uthina-table-lamp":
    "Table lamp 53cm tall with a 30cm shade, which keeps the bulb below eye level when you are sitting up in bed.",
  "wadborough-3-seater-sofa-neutral":
    "Neutral three-seater, 228cm long and 102cm deep. The depth is the measurement that has to clear your doorway on the diagonal.",
};

/** Turns a list of names into "A, B and C". */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const NUMBER_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

function count(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** The product name alone, without the keyword phrase or the `| Kaiku` suffix. */
function productName(title: string): string {
  return title.split("|")[0]!.trim();
}

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  metaTitle: string | null;
}

interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  intro: string[] | null;
  products: number;
  productTitles: string[] | null;
  description: string | null;
}

/**
 * Category titles that mean nothing on their own.
 *
 * Half the catalogue's categories are named for the room they sit under rather than
 * in full — "Storage" under Kitchen, "Lighting" under Bedroom, "Mirrors" under
 * Bathroom. That reads correctly inside the navigation and badly in a search result,
 * where "Storage | Kaiku" is a page about nothing. These take the department's name
 * in front of them.
 */
const NEEDS_ROOM = /^(storage|shelving|lighting|mirrors|furniture|seating)$/i;

/**
 * The singular of a category label, for the categories holding one product.
 *
 * Only the endings that occur in this catalogue: "Accessories" needs "y", "Units" and
 * "Plunges" need the "s" dropped, and an uncountable label like "storage" is already
 * singular and takes a noun instead.
 */
export function singular(label: string): string {
  if (/ies$/i.test(label)) return `${label.slice(0, -3)}y`;
  if (/(ss|us|is)$/i.test(label)) return label;
  if (/s$/i.test(label)) return label.slice(0, -1);
  return `${label} piece`;
}

/** What to call the category in prose and in a title tag. */
export function categoryLabel(category: {
  title: string;
  department: string | null;
}): string {
  if (!category.department || !NEEDS_ROOM.test(category.title.trim()))
    return category.title;
  return `${category.department} ${category.title}`;
}

/**
 * A category description built from the catalogue, for a page with no copy yet.
 *
 * Naming two of the pieces is the part that earns the click: "six kitchen storage
 * pieces" is a category, and "the Natural Teak Log Shelf" is a thing a person can
 * picture.
 */
export function categoryDescription(category: {
  title: string;
  products: number;
  productTitles: string[];
  department: string | null;
}): string | null {
  const names = category.productTitles.map(productName).filter(Boolean);
  if (!names.length) return null;

  // Lowercased word by word, so an acronym survives: "TV Units" has to become
  // "TV units" and not "tv units".
  const label = categoryLabel(category)
    .split(" ")
    .map((word) => (word === word.toUpperCase() ? word : word.toLowerCase()))
    .join(" ");
  // "storage" and "lighting" are not countable, so they need a noun; "mirrors" and
  // "desks" already are one. And a category holding one thing has to say so —
  // "One TV units at Kaiku" was published once and is exactly the sort of line that
  // makes a shopper distrust everything else on the page.
  const noun =
    category.products === 1
      ? singular(label)
      : label.endsWith("s")
        ? label
        : `${label} pieces`;
  const opening = `${count(category.products)} ${noun} at Kaiku`;
  const named = names.slice(0, 2).map((name) => `the ${name}`);
  // "including" needs something to be included in. With one product it is the whole
  // category, so it takes a colon instead.
  const join = (items: string[]) =>
    category.products > items.length
      ? `${opening}, including ${list(items)}.`
      : `${opening}: ${list(items)}.`;
  let text = join(named);

  // Drop back to one name if two overflow, then to none. A description that names
  // nothing is still better than the site default, which names nothing either and
  // says less.
  if (text.length > MAX_DESCRIPTION && named.length > 1)
    text = join([named[0]!]);
  if (text.length > MAX_DESCRIPTION) text = `${opening}.`;
  if (text.length > MAX_DESCRIPTION) return null;

  // Kept to something plainly true. "Direct from the maker" would not be — these
  // ship from the supplier — and a claim in a meta description is still a claim.
  const tail = " Delivered across the UK.";
  if (text.length + tail.length <= MAX_DESCRIPTION) text += tail;

  return text.length >= MIN_DESCRIPTION ? text : null;
}

/** The site's own title pattern: page, then context, then brand. */
export function categoryTitle(category: {
  title: string;
  department: string | null;
}): string {
  const label = categoryLabel(category);
  // No point repeating the room when the label already carries it.
  const withDepartment =
    category.department && !label.startsWith(category.department)
      ? `${label} | ${category.department} | Kaiku`
      : `${label} | Kaiku`;
  return withDepartment.length <= MAX_TITLE
    ? withDepartment
    : `${label} | Kaiku`;
}

async function main() {
  const client = sanity();
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      "id": _id, "slug": slug.current, title,
      "description": seo.metaDescription,
      "metaTitle": seo.metaTitle
    } | order(title asc)`,
  );

  const categories = await client.fetch<CategoryRow[]>(
    `*[_type == "category" && !(_id in path("drafts.**"))]{
      "id": _id, "slug": slug.current, title,
      "department": department->title,
      "intro": intro[].children[].text,
      "products": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)]),
      "productTitles": *[_type == "product" && !(_id in path("drafts.**")) && references(^._id)] | order(price asc) [0...2].title,
      "description": seo.metaDescription
    } | order(products desc)`,
  );

  console.log("PRODUCTS\n");
  const productFixes: { row: ProductRow; description: string; why: string }[] =
    [];
  let clean = 0;
  let stillUnwritten = 0;
  for (const row of products) {
    const existing = row.description?.trim() ?? "";
    const faults: string[] = [];
    if (!existing) faults.push("no description");
    if (existing.length > MAX_DESCRIPTION)
      faults.push(`${existing.length} chars`);
    if (existing && ARTEFACT.test(existing)) faults.push("chat artefact");
    if (existing && hasBannedPhrase(existing)) faults.push("trade language");
    if (!faults.length) {
      clean += 1;
      continue;
    }

    // Hand-written copy wins over anything salvaged from the old description: it was
    // written knowing the fault, and the salvage is only a rescue.
    const written = HAND_WRITTEN[row.slug];
    const fitted = written ?? (existing ? fitDescription(existing) : null);
    if (!fitted) {
      stillUnwritten += 1;
      console.log(
        `  !       ${row.slug} — ${faults.join(", ")}, and nothing usable survives. Add it to HAND_WRITTEN.`,
      );
      continue;
    }
    if (fitted.length > MAX_DESCRIPTION) {
      stillUnwritten += 1;
      console.log(
        `  !       ${row.slug} — replacement is ${fitted.length} chars, over the ${MAX_DESCRIPTION} limit.`,
      );
      continue;
    }
    if (hasBannedPhrase(fitted) || ARTEFACT.test(fitted)) {
      stillUnwritten += 1;
      console.log(`  !       ${row.slug} — replacement trips the house rules.`);
      continue;
    }
    productFixes.push({
      row,
      description: fitted,
      why: written
        ? `${faults.join(", ")} → written by hand`
        : faults.join(", "),
    });
  }

  for (const fix of productFixes.slice(0, 6)) {
    console.log(`  fix     ${fix.row.slug}  (${fix.why})`);
    console.log(`     was  ${fix.row.description!.trim().slice(0, 150)}…`);
    console.log(`     now  ${fix.description}  [${fix.description.length}]`);
  }
  if (productFixes.length > 6)
    console.log(`  … and ${productFixes.length - 6} more`);

  const longTitles = products.filter(
    (row) => (row.metaTitle?.trim().length ?? 0) > MAX_TITLE,
  );

  const byHand = productFixes.filter((fix) =>
    fix.why.includes("written by hand"),
  ).length;

  console.log(
    `\n  ${productFixes.length} to repair (${byHand} written by hand, ${productFixes.length - byHand} cleaned and fitted) · ` +
      `${clean} already fine · ${stillUnwritten} still need copy · ` +
      `${longTitles.length} meta titles over ${MAX_TITLE} chars (reported, not changed)\n`,
  );

  console.log("CATEGORIES\n");
  const categoryFixes: {
    row: CategoryRow;
    title: string;
    description: string;
    source: string;
  }[] = [];
  for (const row of categories) {
    if (!row.products) continue;
    const existing = row.description?.trim();
    // A description this script generated can be replaced when the generator
    // improves; anything else was written by a person and is left alone.
    if (existing && !(force && GENERATED.test(existing))) continue;

    const fromIntro = row.intro?.length
      ? (fitDescription(row.intro.join(" ")) ??
        row.intro.join(" ").slice(0, MAX_DESCRIPTION))
      : null;
    const description =
      fromIntro && fromIntro.length >= MIN_DESCRIPTION
        ? fromIntro
        : categoryDescription({
            title: row.title,
            products: row.products,
            productTitles: row.productTitles ?? [],
            department: row.department,
          });

    if (!description) {
      console.log(
        `  !       ${row.slug} — nothing to build a description from`,
      );
      continue;
    }
    if (hasBannedPhrase(description)) {
      console.log(`  !       ${row.slug} — intro copy trips the house rules`);
      continue;
    }

    categoryFixes.push({
      row,
      title: categoryTitle({ title: row.title, department: row.department }),
      description,
      source: fromIntro === description ? "intro copy" : "catalogue",
    });
  }

  for (const fix of categoryFixes) {
    console.log(
      `  set     ${fix.row.slug.padEnd(28)} ${fix.source.padEnd(11)} [${fix.description.length}]`,
    );
    console.log(`          ${fix.description}`);
  }

  console.log(
    `\n  ${categoryFixes.length} stocked categories given a title and description\n`,
  );

  if (!apply) {
    console.log("Dry run — nothing written.\n");
    return;
  }

  for (const fix of productFixes)
    await client
      .patch(fix.row.id)
      .set({ "seo.metaDescription": fix.description })
      .commit({ visibility: "async" });

  for (const fix of categoryFixes)
    await client
      .patch(fix.row.id)
      .set({
        "seo.metaTitle": fix.title,
        "seo.metaDescription": fix.description,
      })
      .commit({ visibility: "async" });

  console.log(
    `Wrote ${productFixes.length} product descriptions and ${categoryFixes.length} category pairs.\n`,
  );
}

// Guarded so importing this file for its pure functions does not run the audit.
if (process.argv[1]?.includes("rewrite-meta"))
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
