/**
 * Fills in specs and highlights for the four Outsunny products.
 *
 * All four went live with an empty spec table and no highlights, which
 * scripts/audit-products.ts flags as TRUST: the page renders a description and
 * then nothing a buyer can scan. On a £60 solar lantern that costs a sale; the
 * comparison is with an Amazon listing that has a bullet list.
 *
 * Every figure here is read off the supplier's own dimensions diagram, which is
 * image 4 or 3 in each gallery — 94 cm on the BBQ, 160 cm on the lamp post,
 * 72 cm on the water feature, 68 cm on the lantern. All four match the
 * `dimensions` already stored, which is why the diagrams are trusted as the
 * source for the figures the diagrams add: the 46.5 cm bowl, the 44 cm cooking
 * grate, the 43 cm and 21 cm pour heights, the 18 cm lantern head.
 *
 * Nothing is inferred beyond that. There is no wattage, lumen output, battery
 * capacity or IP rating in the material available, so none is listed — a made-up
 * IP rating on an outdoor light is the sort of claim a customer discovers in
 * the rain.
 *
 * Never overwrites a spec table or highlight list that already has entries.
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/complete-outsunny-specs.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

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

interface Detail {
  specs: [label: string, value: string][];
  highlights: string[];
}

const DETAIL: Record<string, Detail> = {
  "portable-charcoal-bbq-grill-with-wheels": {
    specs: [
      ["Fuel", "Charcoal"],
      ["Overall size", "48 cm W × 56 cm D × 94 cm H"],
      ["Bowl diameter", "46.5 cm"],
      ["Cooking grate", "44 cm diameter, chrome-plated steel"],
      ["Charcoal grate", "33 cm diameter"],
      ["Cooking depth", "18 cm from grate to lid"],
      ["Body", "Enamelled steel"],
      ["Legs", "Stainless steel, on two wheels"],
      ["Storage shelf", "29.5 cm diameter, plus a lower wire rack"],
      ["Handles", "Anti-scald wood"],
      ["Vents", "Adjustable top vent"],
      ["Weight", "5.5 kg"],
      ["Assembly", "Self-assembly required"],
    ],
    highlights: [
      "Domed lid holds heat, so it smokes and roasts as well as it grills",
      "Adjustable top vent to set the temperature inside",
      "44 cm cooking grate — enough for six to eight portions at once",
      "Two wheels and 5.5 kg all in, so one person can move it",
      "Lower shelf and wire rack for charcoal, tools and plates",
      "Enamelled steel body on stainless steel legs",
      "Anti-scald wooden handles on the lid and bowl",
    ],
  },
  "solar-garden-lamp-post-dimmable-led-black": {
    specs: [
      ["Power", "Solar — no mains wiring or cabling"],
      ["Height", "160 cm"],
      ["Lantern head", "18 cm × 18 cm"],
      ["Light source", "LED, dimmable"],
      ["Operation", "Automatic dusk-to-dawn light sensor"],
      ["Solar panel", "Integrated into the lantern roof"],
      ["Finish", "Black"],
      ["Glazing", "Clear panels, four-sided lantern"],
      ["Mounting", "Base plate with expansion screws, or ground stake"],
      ["Weight", "1.1 kg"],
      ["Assembly", "Sectional post, self-assembly"],
    ],
    highlights: [
      "No wiring — charges by day and lights itself at dusk",
      "Switches itself off at dawn, so nothing to remember",
      "Adjustable brightness",
      "160 cm tall: lights a path or driveway rather than just the ground",
      "Two fixings supplied — screws for paving, a stake for lawn or border",
      "Traditional four-sided lantern in black, suited to period and modern houses",
    ],
  },
  "solar-garden-water-feature-led-pump": {
    specs: [
      ["Power", "Solar — separate panel on a lead, no mains wiring"],
      ["Overall size", "37 cm W × 36 cm D × 72 cm H"],
      ["Tiers", "Four cascading pots"],
      ["Pour heights", "43 cm and 21 cm"],
      ["Lighting", "Integrated LED"],
      ["Pump", "Recirculating — no plumbing needed"],
      ["Material", "Weather-resistant resin"],
      ["Finish", "Bronze pots on grey stone-effect rock"],
      ["Weight", "10.2 kg"],
      ["Assembly", "Fill with water and site the solar panel in sun"],
    ],
    highlights: [
      "Solar powered and self-recirculating — no wiring and no plumbing",
      "Panel sits on a lead, so the feature can go where it looks best",
      "Four-tier cascade for continuous water sound",
      "LED lighting inside the pots for use after dark",
      "72 cm tall: reads as a focal point rather than an ornament",
      "Weather-resistant resin moulded as stacked stone and aged pots",
    ],
  },
  "solar-outdoor-garden-floor-lantern-led-light": {
    specs: [
      ["Power", "Solar — no mains wiring"],
      ["Size", "20 cm × 20 cm × 68 cm H"],
      ["Light source", "LED"],
      ["Operation", "Automatic dusk-to-dawn light sensor, plus on/off switch"],
      ["Solar panel", "Integrated into the lid"],
      ["Material", "Woven weather-resistant rattan effect over a diffuser"],
      ["Finish", "Dark grey"],
      ["Placement", "Freestanding — patio, path, balcony or border"],
      ["Weight", "2.5 kg"],
    ],
    highlights: [
      "No wiring — stands anywhere it gets daylight",
      "Dusk-to-dawn sensor, with a switch to turn it off",
      "Light filters through the woven slats rather than glaring",
      "68 cm tall, so it lights at knee height instead of ankle height",
      "Freestanding — nothing to fix down, and it can be moved or stored",
      "Weather-resistant woven finish in dark grey",
    ],
  },
};

async function main() {
  let written = 0;
  let kept = 0;

  for (const [slug, detail] of Object.entries(DETAIL)) {
    // Published and draft copies both: publishing a draft would otherwise put
    // the empty spec table straight back on the live page.
    const docs = await client.fetch<
      { _id: string; title: string; specs: number; highlights: number }[]
    >(
      `*[_type == "product" && slug.current == $slug]{
        _id, title, "specs": count(specs), "highlights": count(highlights)
      }`,
      { slug },
    );

    if (!docs.length) {
      console.warn(`✗ ${slug}: no product with this slug`);
      continue;
    }

    for (const doc of docs) {
      const draft = doc._id.startsWith("drafts.");
      const patch: Record<string, unknown> = {};

      if (doc.specs) {
        kept++;
      } else {
        patch.specs = detail.specs.map(([label, value]) => ({
          _type: "productSpec",
          label,
          value,
        }));
      }
      if (doc.highlights) kept++;
      else patch.highlights = detail.highlights;

      const fields = Object.keys(patch);
      if (!fields.length) continue;
      if (apply) await client.patch(doc._id).set(patch).commit();
      console.log(
        `${apply ? "✓" : "·"} ${doc.title.slice(0, 50).padEnd(52)}${draft ? "[draft] " : "        "}` +
          `${detail.specs.length} spec(s), ${detail.highlights.length} highlight(s)`,
      );
      written += fields.length;
    }
  }

  console.log(
    `\n${written} field(s) ${apply ? "written" : "to write"}` +
      `${kept ? `, ${kept} left as they were` : ""}.`,
  );
  if (!apply) console.log("Dry run — nothing written. Re-run with --apply.\n");
  else console.log("");
}

main().catch((err) => {
  console.error("complete-outsunny-specs failed:", err);
  process.exit(1);
});
