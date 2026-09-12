/**
 * The 18 buying-guide meta descriptions Google cuts off.
 *
 * All 18 run between 164 and 200 characters against a limit of about 160, so
 * every one of them loses its ending in a search result — and the ending is
 * usually the line that says why the guide is worth opening.
 *
 * Trimmed by hand rather than by rule, because what makes these good is the
 * concrete figures — "7ft (213cm) of floor clearance", "23-26 hardbacks per
 * linear metre", "2700-3000K" — and a mechanical cut takes whatever happens to
 * fall past the limit. The numbers are kept in every case; what goes is
 * restatement, and the closing "explained" clause where the sentence before it
 * already made the promise.
 *
 * No figure is changed. Each rewrite is checked against the original for the
 * numbers it contains before anything is written.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-guide-meta-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-guide-meta-descriptions.ts --apply
 */
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
  perspective: "raw",
});

const DESC_MAX = 160;

/** Guide slug → the trimmed description. */
const DESCRIPTIONS: Record<string, string> = {
  "pergola-vs-gazebo-and-privacy-screen-height":
    "A gazebo shelters with netting and a solid roof; a pergola is architectural, with a retractable canopy. UK permitted development allows 2m at a boundary.",
  "chandelier-vs-pendant-light":
    "A pendant needs 7ft (213cm) of floor clearance in a walkway, 75cm above a dining table. A chandelier's ornamental scale wants 8-9ft of ceiling height.",
  "cold-plunge-chiller-vs-ice-and-temperature":
    "We sell one cold plunge, chiller-equipped rather than ice-based — why that earns its cost, the real temperature range, and pairing it with a sauna.",
  "solar-vs-mains-garden-lighting-and-water-features":
    "Solar suits paths and borders with 4-5 hours of direct sun, no cabling, no running cost. Mains suits shade and winter. Water features are mains, not solar.",
  "wall-art-size-and-arrangement":
    "A gallery wall is sized as one shape, at the same two-thirds proportion as a single canvas. When a statement piece beats a group, and how to space it.",
  "coffee-table-top-material":
    "Marble marks from heat, wood scratches but sands out, glass wipes clean but shows fingerprints, rattan is the least fussy. What each costs you day to day.",
  "best-planter-material-for-winter":
    "Terracotta absorbs water and cracks when it freezes. Stoneware, stone-effect, metal and synthetic rattan cope better. What to leave out, what to bring in.",
  "what-shape-mirror":
    "Round softens hard edges, rectangular matches a grid of frames, arched and octagonal read as traditional. The two-thirds sizing rule holds across them all.",
  "shelving-how-many-and-open-or-cupboard":
    "~23-26 hardbacks per linear metre solid-packed — real capacity is 65-75% of that. Open shelving displays; a cupboard hides the mess. Which suits which room.",
  "fire-pit-fuel-type":
    "Gas lights instantly, no smoke or ash. Wood gives real flame but needs ventilation. Electric is the only safe option under cover. 8 real fire pits compared.",
  "floor-lamp-placement":
    "A reading lamp's shade sits at shoulder height, close to the chair. An ambient corner lamp is taller and further away, bouncing light off the ceiling.",
  "chest-of-drawers-vs-wardrobe":
    "A wardrobe stores what needs to hang; a chest of drawers what doesn't. Most bedrooms need both rather than more of one. 8 real pieces measured.",
  "warm-vs-cool-white-light-by-room":
    "Warm white (2700-3000K) for living rooms and bedrooms, neutral (3500-4000K) for kitchens and bathrooms, cool white (5000K+) for task spaces.",
  "bathroom-storage-ideas":
    "We don't sell vanity units — what we do sell is baskets, wall shelves and caddies, for what you use daily, kept in reach rather than hidden.",
  "choosing-a-sofa":
    "We sell velvet, linen, textured weave and chenille sofas, not leather — which fabric suits your household, and whether a corner or 3-seater fits.",
  "infrared-vs-traditional-sauna":
    "Infrared heats your body directly at 45-60°C; traditional heats the room to 70-90°C+. We sell electric-heated cabins, not wood-fired. 7 saunas compared.",
  "sofa-size-for-your-room":
    "2-seater 140-180cm, 3-seater 198-229cm, both ~85-100cm deep — there's no fixed standard. The room each needs, and 8 real sofas measured.",
  "tv-unit-size-and-height":
    "A 65in TV is ~144cm wide, not 165cm — plus 5-20cm either side. Screen centre 100-110cm from the floor. 8 real units measured.",
};

/** Every number in a string, for checking none were lost or altered. */
function figures(value: string): string[] {
  return (value.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();
}

async function main() {
  const tooLong = Object.entries(DESCRIPTIONS).filter(
    ([, text]) => text.length > DESC_MAX,
  );
  if (tooLong.length) {
    console.error("These rewrites are still over the limit:");
    for (const [slug, text] of tooLong) {
      console.error(`  [${text.length}] ${slug}`);
    }
    process.exit(1);
  }

  const rows = await client.fetch<
    {
      _id: string;
      slug: string;
      metaDescription: string | null;
      excerpt: string | null;
      draft: boolean;
    }[]
  >(
    `*[_type=="buyingGuide" && slug.current in $slugs]{
      _id, "slug": slug.current, "metaDescription": seo.metaDescription,
      "excerpt": coalesce(excerpt, standfirst, summary),
      "draft": _id in path("drafts.**") }`,
    { slugs: Object.keys(DESCRIPTIONS) },
  );

  const missing = Object.keys(DESCRIPTIONS).filter(
    (slug) => !rows.some((row) => row.slug === slug),
  );
  if (missing.length) {
    console.error(`No such guide: ${missing.join(", ")}`);
    process.exit(1);
  }

  let lostFigures = 0;
  console.log(`\n${rows.length} documents.\n`);
  for (const row of rows.filter((r) => !r.draft)) {
    const before = row.metaDescription?.trim() || row.excerpt || "";
    const after = DESCRIPTIONS[row.slug]!;
    const beforeFigures = figures(before);
    const afterFigures = figures(after);
    const dropped = beforeFigures.filter((n) => !afterFigures.includes(n));

    console.log(`  ${row.slug}`);
    console.log(`    [${before.length}] -> [${after.length}]`);
    if (dropped.length) {
      lostFigures += 1;
      console.log(`    figures no longer present: ${dropped.join(", ")}`);
    }
  }

  if (lostFigures) {
    console.log(
      `\n${lostFigures} rewrite(s) dropped a number — check those above are deliberate.`,
    );
  } else {
    console.log("\nEvery figure in every original survives the rewrite.");
  }

  if (!apply) {
    console.log("\nDry run — re-run with --apply.");
    return;
  }

  for (const row of rows) {
    await client
      .patch(row._id)
      .set({ "seo.metaDescription": DESCRIPTIONS[row.slug]! })
      .commit();
  }
  console.log(`\nApplied ${rows.length} descriptions.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
