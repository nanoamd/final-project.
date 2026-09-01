/**
 * Fixes the "quotes the supplier" artefact (the phrasing bug — "the supplier
 * states/specifies/recommends X" — distinct from the literal supplier-name
 * leak already fixed) across the 19 published products still carrying it
 * after the post-emergency re-audit on 1 September.
 *
 * Every replacement below was written after reading the actual sentence —
 * the fact stays exactly as it was, only the "the supplier says so" framing
 * is removed and the sentence restated as Kaiku's own. Nothing invented.
 *
 * Blocks are matched and replaced by their full concatenated text and
 * collapsed to a single span, never by touching children[0] alone and
 * leaving the rest — the exact bug that corrupted 35 products in the
 * supplier-name-leak fix earlier today. Same lesson applied here from the
 * start instead of learned the hard way twice.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-hedge-published.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-hedge-published.ts --apply
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

interface Fix {
  id: string;
  title: string;
  field: "summary" | "description" | "faq";
  from: string;
  to: string;
  faqQuestion?: string;
}

const FIXES: Fix[] = [
  {
    id: "premier-housewares-5535004",
    title: "Allegra Champagne Finish Tumbler",
    field: "faq",
    faqQuestion: "Does each tumbler vary in appearance?",
    from: "The supplier does not state that each piece varies, but some handmade items may have slight variations.",
    to: "Handmade items like this can have slight variations piece to piece.",
  },
  {
    id: "product-aosom-842-345v70cg",
    title: "50,000 BTU Gas Fire Pit Table with Glass Screen, Dark Grey",
    field: "faq",
    faqQuestion: "What safety features does it have?",
    from: "The fire pit is CE (GAR) certified; however, specific safety features are not detailed on the supplier page.",
    to: "The fire pit is CE (GAR) certified.",
  },
  {
    id: "product-import-13-6m-44ft-6in-plug-in-led-warm-white-christmas-string-light",
    title: "13.6m Warm White Decorative LED String Lights",
    field: "summary",
    from: "Create warm, atmospheric illumination throughout your home with these 13.6m Warm White Decorative LED String Lights. Featuring 500 individual LED light points along an extensive 13.6-metre strand, they provide an easy way to introduce subtle decorative lighting across walls, furniture, shelving, architectural features and interior displays.\nThe warm white glow creates a softer, more inviting atmosphere than conventional overhead lighting, while the discreet silver-toned wiring allows the lights to blend naturally into surrounding décor. Their generous length gives you plenty of flexibility to create layered lighting arrangements, wrap them around decorative features or weave them through greenery.\nDesigned as decorative ambient lighting rather than solely seasonal lighting, these versatile LED string lights can be incorporated into everyday interiors as well as special occasions and seasonal displays. The supplier specifies that they are indoor-rated.",
    to: "Create warm, atmospheric illumination throughout your home with these 13.6m Warm White Decorative LED String Lights. Featuring 500 individual LED light points along an extensive 13.6-metre strand, they provide an easy way to introduce subtle decorative lighting across walls, furniture, shelving, architectural features and interior displays.\nThe warm white glow creates a softer, more inviting atmosphere than conventional overhead lighting, while the discreet silver-toned wiring allows the lights to blend naturally into surrounding décor. Their generous length gives you plenty of flexibility to create layered lighting arrangements, wrap them around decorative features or weave them through greenery.\nDesigned as decorative ambient lighting rather than solely seasonal lighting, these versatile LED string lights can be incorporated into everyday interiors as well as special occasions and seasonal displays. These lights are indoor-rated.",
  },
  {
    id: "product-import-alto-putty-grey-table",
    title: "Alto Putty Grey Outdoor Table",
    field: "description",
    from: "The supplier specifically highlights its suitability for commercial settings, making the table a practical option for outdoor dining environments where furniture needs to combine appearance with durability.",
    to: "It's well suited to commercial settings, a practical option for outdoor dining environments where furniture needs to combine appearance with durability.",
  },
  {
    id: "product-import-alto-putty-grey-table",
    title: "Alto Putty Grey Outdoor Table",
    field: "faq",
    faqQuestion: "Is the Alto suitable for restaurants and cafés?",
    from: "Yes. The supplier specifically describes the table as suitable for commercial settings including restaurants and cafés.",
    to: "Yes — it's suitable for commercial settings including restaurants and cafés.",
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa",
    field: "description",
    from: "The supplier states that this is a heavy item and that assembly requires a minimum of two people. Assembly should be carried out on a firm, flat surface in a well-lit, dry area.",
    to: "This is a heavy item, and assembly requires a minimum of two people. Carry it out on a firm, flat surface in a well-lit, dry area.",
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa",
    field: "faq",
    faqQuestion: "Does the sofa require assembly?",
    from: "Yes. The supplier states that assembly requires a minimum of two people.",
    to: "Yes — assembly requires a minimum of two people.",
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa",
    field: "faq",
    faqQuestion: "How do I clean the HDPE wicker?",
    from: "The supplier recommends washing the HDPE wicker with mild soapy water.",
    to: "Wash the HDPE wicker with mild soapy water.",
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa",
    field: "faq",
    faqQuestion: "How should I clean the cushions?",
    from: "The supplier recommends sponge cleaning the cushions.",
    to: "Sponge clean the cushions.",
  },
  {
    id: "product-import-eucalyptus-plant-in-stone-effect-pot",
    title: "Eucalyptus Plant In Stone Effect Pot",
    field: "description",
    from: "The supplier specifically identifies complementary eucalyptus sprays and other artificial plants as suitable for creating fuller displays.",
    to: "Complementary eucalyptus sprays and other artificial plants work well alongside it for creating fuller displays.",
  },
  {
    id: "product-import-eucalyptus-plant-in-stone-effect-pot",
    title: "Eucalyptus Plant In Stone Effect Pot",
    field: "description",
    from: "The supplier specifies the Eucalyptus Plant as suitable for indoor and fair-weather outdoor use.",
    to: "It's suitable for indoor and fair-weather outdoor use.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "summary",
    from: "Transform your outdoor space into an elegant dining destination with the Provence Collection Outdoor 4 Seater Dining Set. Combining the timeless appearance of woven rattan with robust, weather-resistant materials, this sophisticated four-seater set is designed for relaxed outdoor dining, entertaining and everyday garden living.\nThe set features a durable HDPE rattan-style weave, a rust-resistant powder-coated aluminium frame and a 5mm tempered glass tabletop, creating an attractive balance between natural texture and contemporary practicality. Generously cushioned seating is finished in fade-resistant grade 5 Olefin fabric, offering shower resistance, UV resistance and faster drying after light rain.\nWith its warm beige colour palette and clean-lined design, the Provence dining set works beautifully across contemporary gardens, Mediterranean-inspired terraces and sophisticated outdoor living spaces. It can remain outdoors year-round, although the supplier recommends protective covering to help extend its lifespan.",
    to: "Transform your outdoor space into an elegant dining destination with the Provence Collection Outdoor 4 Seater Dining Set. Combining the timeless appearance of woven rattan with robust, weather-resistant materials, this sophisticated four-seater set is designed for relaxed outdoor dining, entertaining and everyday garden living.\nThe set features a durable HDPE rattan-style weave, a rust-resistant powder-coated aluminium frame and a 5mm tempered glass tabletop, creating an attractive balance between natural texture and contemporary practicality. Generously cushioned seating is finished in fade-resistant grade 5 Olefin fabric, offering shower resistance, UV resistance and faster drying after light rain.\nWith its warm beige colour palette and clean-lined design, the Provence dining set works beautifully across contemporary gardens, Mediterranean-inspired terraces and sophisticated outdoor living spaces. It can remain outdoors year-round, though a protective cover when it's not in use will help extend its lifespan.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "description",
    from: "The supplier states that the set can remain outdoors throughout the year, although using a protective cover when the furniture is not being used will help extend its lifespan and maintain its appearance.",
    to: "The set can remain outdoors throughout the year, although using a protective cover when it's not in use will help extend its lifespan and maintain its appearance.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "description",
    from: "The supplier nevertheless recommends protective covering to help maintain the furniture over time.",
    to: "A protective cover, even so, helps maintain the furniture over time.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "faq",
    faqQuestion: "Can the dining set stay outside all year?",
    from: "Yes. The supplier states that the furniture can remain outdoors year-round. However, using a protective cover when not in use will help extend its lifespan.",
    to: "Yes — the furniture can remain outdoors year-round. Using a protective cover when it's not in use will help extend its lifespan.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "faq",
    faqQuestion: "Is the glass tabletop easy to maintain?",
    from: "Yes. The supplier highlights the tempered glass tabletop as being easy to maintain.",
    to: "Yes — the tempered glass tabletop is easy to maintain.",
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    field: "faq",
    faqQuestion: "Does this product require assembly?",
    from: "The supplier's warning states that assembly requires a minimum of two people and that the item and its parts are heavy.",
    to: "Assembly requires a minimum of two people — the item and its parts are heavy.",
  },
  {
    id: "product-import-provence-collection-outdoor-dining-chair",
    title: "Provence Collection Outdoor Dining Chair",
    field: "description",
    from: "The supplier describes the frame as rust-proof and designed to maintain structural integrity in challenging outdoor conditions.",
    to: "The frame is rust-proof and designed to maintain structural integrity in challenging outdoor conditions.",
  },
  {
    id: "product-import-provence-collection-outdoor-dining-chair",
    title: "Provence Collection Outdoor Dining Chair",
    field: "description",
    from: "The supplier recommends cleaning the HDPE rattan with mild soapy water and a soft brush, avoiding abrasive solvents. The cushions should be sponge cleaned only.",
    to: "Clean the HDPE rattan with mild soapy water and a soft brush, avoiding abrasive solvents. Sponge clean the cushions only.",
  },
  {
    id: "product-import-provence-collection-outdoor-dining-chair",
    title: "Provence Collection Outdoor Dining Chair",
    field: "faq",
    faqQuestion: "How should I clean the cushion?",
    from: "The supplier recommends sponge cleaning only for the cushions.",
    to: "Sponge clean the cushions only.",
  },
  {
    id: "product-import-saltaire-collection-3-shelf-unit",
    title: "Saltaire Collection 3-Shelf Unit",
    field: "description",
    from: "The Saltaire is a substantial piece of furniture weighing approximately 32 kg, and the supplier states that assembly requires a minimum of two people.",
    to: "The Saltaire is a substantial piece of furniture weighing approximately 32kg, and assembly requires a minimum of two people.",
  },
  {
    id: "product-import-saltaire-collection-3-shelf-unit",
    title: "Saltaire Collection 3-Shelf Unit",
    field: "faq",
    faqQuestion: "Does the unit require assembly?",
    from: "Yes. Assembly is required, and the supplier states that a minimum of two people should assemble the unit.",
    to: "Yes — assembly is required, and a minimum of two people should assemble the unit.",
  },
  {
    id: "product-import-sepia-shadows-squat-table-lamp-with-linen-shade",
    title: "Sepia Shadows Squat Table Lamp With Linen Shade",
    field: "description",
    from: "The supplier specifies that partial assembly is required.",
    to: "Partial assembly is required.",
  },
  {
    id: "product-import-seville-collection-lebes-planter",
    title: "Seville Collection Lebes Planter",
    field: "description",
    from: "The supplier specifically positions the Lebes Planter as an excellent vessel for premium artificial botanicals.",
    to: "The Lebes Planter is an excellent vessel for premium artificial botanicals.",
  },
  {
    id: "product-import-seville-collection-lebes-planter",
    title: "Seville Collection Lebes Planter",
    field: "description",
    from: "The supplier highlights pairings with products such as Green Viburnum Spray and Light Blue Agapanthus, while also suggesting softer combinations involving roses and mock orange flowers.",
    to: "It pairs well with pieces such as Green Viburnum Spray and Light Blue Agapanthus, or softer combinations involving roses and mock orange flowers.",
  },
  {
    id: "product-import-seville-collection-lebes-planter",
    title: "Seville Collection Lebes Planter",
    field: "faq",
    faqQuestion: "Can I use artificial flowers with it?",
    from: "Yes. The supplier specifically highlights the planter as being suitable for showcasing premium artificial botanicals",
    to: "Yes — it's well suited to showcasing premium artificial botanicals.",
  },
  {
    id: "product-import-siena-brown-round-ribbed-planter",
    title: "Siena Brown Round Ribbed Planter",
    field: "description",
    from: "The Siena can be used for decorative planting, but if real flowers are displayed in the planter, the supplier recommends using florist's cellophane to contain water.",
    to: "The Siena can be used for decorative planting, but if real flowers are displayed in the planter, use florist's cellophane to contain water.",
  },
  {
    id: "product-import-siena-brown-round-ribbed-planter",
    title: "Siena Brown Round Ribbed Planter",
    field: "faq",
    faqQuestion: "Can the Siena be used outdoors? ",
    from: "Yes. The supplier describes it as suitable for indoor and outdoor styling.",
    to: "Yes — it's suitable for indoor and outdoor styling.",
  },
  {
    id: "product-import-siena-brown-round-ribbed-planter",
    title: "Siena Brown Round Ribbed Planter",
    field: "faq",
    faqQuestion: "Can I put real flowers directly into the planter? ",
    from: "If using real flowers with water, the supplier recommends using florist's cellophane wrap to contain the water.",
    to: "If using real flowers with water, use florist's cellophane wrap to contain the water.",
  },
  {
    id: "product-import-small-blue-flora-planter-pot",
    title: "Small Blue Flora Planter Pot",
    field: "faq",
    faqQuestion: "Is the planter suitable for outdoor use?",
    from: "No. The supplier specifies indoor use only.",
    to: "No — indoor use only.",
  },
  {
    id: "product-import-solara-orb-pendant-ceiling-light",
    title: "Solara Orb Pendant Ceiling Light",
    field: "faq",
    faqQuestion: "What is the Solara made from? ",
    from: "The supplier specifies the material as wood.",
    to: "The material is wood.",
  },
  {
    id: "product-import-solara-orb-pendant-ceiling-light",
    title: "Solara Orb Pendant Ceiling Light",
    field: "faq",
    faqQuestion: "What colours is the Solara available in? ",
    from: "The supplier specifies the colour as brown and white.",
    to: "It's available in brown and white.",
  },
  {
    id: "product-import-solara-orb-pendant-ceiling-light",
    title: "Solara Orb Pendant Ceiling Light",
    field: "faq",
    faqQuestion: "Does the Solara require professional installation? ",
    from: "Yes. The supplier states that the item needs to be fitted by a trained electrician.",
    to: "Yes — it needs to be fitted by a trained electrician.",
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black",
    field: "description",
    from: "The supplier specifically warns not to hang or place this mirror above a heat source.",
    to: "Don't hang or place this mirror above a heat source.",
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black",
    field: "faq",
    faqQuestion: "Is the mirror handcrafted?",
    from: "Yes. The supplier describes the mirror as handcrafted.",
    to: "Yes — it's handcrafted.",
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black",
    field: "faq",
    faqQuestion: "Can I hang multiple mirrors together?",
    from: "Yes. The supplier specifically recommends displaying the mirror individually or in multiples to create a stronger wall feature.",
    to: "Yes — displaying it individually or in multiples both work; multiples create a stronger wall feature.",
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black",
    field: "faq",
    faqQuestion: "Can I place the mirror above a radiator?",
    from: "No. The supplier specifically warns not to hang or place the mirror above a heat source.",
    to: "No — don't hang or place it above a heat source.",
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp",
    field: "summary",
    from: "Introduce understated elegance and soft ambient lighting with the Symi Slim Table Lamp. Featuring a handcrafted white wooden base with subtly distressed edges and a natural linen shade, this refined table lamp combines timeless styling with a relaxed, tactile character.\nIts slim, understated silhouette makes it particularly versatile throughout the home, working beautifully on bedside tables, consoles, sideboards, desks and shelving. The white finish allows the Symi to blend effortlessly into neutral interiors while also providing a crisp contrast against darker colour schemes.\nDesigned to complement both light and airy spaces and richer, moodier interiors, the Symi is an adaptable lighting piece that adds warmth, texture and character without overwhelming its surroundings. The supplier describes it as a timeless piece that is particularly suited to neutral décor schemes.",
    to: "Introduce understated elegance and soft ambient lighting with the Symi Slim Table Lamp. Featuring a handcrafted white wooden base with subtly distressed edges and a natural linen shade, this refined table lamp combines timeless styling with a relaxed, tactile character.\nIts slim, understated silhouette makes it particularly versatile throughout the home, working beautifully on bedside tables, consoles, sideboards, desks and shelving. The white finish allows the Symi to blend effortlessly into neutral interiors while also providing a crisp contrast against darker colour schemes.\nDesigned to complement both light and airy spaces and richer, moodier interiors, the Symi is an adaptable lighting piece that adds warmth, texture and character without overwhelming its surroundings. It's a timeless piece particularly suited to neutral décor schemes.",
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp",
    field: "description",
    from: "The supplier specifically highlights its suitability for dark and moody interiors, where the white finish can provide a striking contrast.",
    to: "It suits dark and moody interiors especially well, where the white finish provides a striking contrast.",
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp",
    field: "faq",
    faqQuestion: "Is the lamp handcrafted?",
    from: "Yes. The supplier describes the Symi as handcrafted.",
    to: "Yes — it's handcrafted.",
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp",
    field: "faq",
    faqQuestion: "Does the lamp work in dark interiors?",
    from: "Yes. The supplier specifically highlights its suitability for dark and moody interiors, where the white finish creates contrast.",
    to: "Yes — it suits dark and moody interiors well, where the white finish creates contrast.",
  },
  {
    id: "product-import-tarn-collection-large-pot-with-handles",
    title: "Tarn Large Pot with Handles",
    field: "description",
    from: "Please note: flowers and plants shown in the supplier's product photography are not included with the pot.",
    to: "Please note: the flowers and plants shown in photography are not included with the pot.",
  },
  {
    id: "product-import-tarn-collection-large-pot-with-handles",
    title: "Tarn Large Pot with Handles",
    field: "faq",
    faqQuestion: "Is the Tarn Large Pot watertight?",
    from: "Yes. The supplier specifies that the pot is watertight, allowing it to be used with fresh floral arrangements as well as dried displays.",
    to: "Yes — it's watertight, so it works with fresh floral arrangements as well as dried displays.",
  },
  {
    id: "product-import-tarn-collection-large-pot-with-handles",
    title: "Tarn Large Pot with Handles",
    field: "faq",
    faqQuestion: "Can I use the Tarn Large Pot outdoors?",
    from: "No. The supplier specifies this product for indoor use only.",
    to: "No — indoor use only.",
  },
  {
    id: "product-import-teos-table-lamp",
    title: "Teos Table Lamp",
    field: "faq",
    faqQuestion: "Does the Teos require assembly?",
    from: "Yes. The supplier specifies that partial assembly is required.",
    to: "Yes — partial assembly is required.",
  },
  {
    id: "product-import-the-dales-glow-indoor-infrared-sauna-by-saunaplunge-2-person-9bf29917",
    title: "SaunaPlunge Dales Glow 2 Person Indoor Infrared Sauna",
    field: "description",
    from: "The Dales Glow is a plug-and-play sauna and does not require specialist hardwiring when installed according to the manufacturer’s instructions.",
    to: "The Dales Glow is a plug-and-play sauna and does not require specialist hardwiring when installed according to the included instructions.",
  },
];

interface Span {
  _type: string;
  text?: string;
  [key: string]: unknown;
}
interface Block {
  _type: string;
  children?: Span[];
  [key: string]: unknown;
}
interface Faq {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

function collapseBlock(block: Block, newText: string): Block {
  const children = block.children ?? [];
  return { ...block, children: [{ ...children[0]!, text: newText }] };
}

async function main() {
  const byId = new Map<string, Fix[]>();
  for (const fix of FIXES) {
    byId.set(fix.id, [...(byId.get(fix.id) ?? []), fix]);
  }

  const transaction = client.transaction();
  let queued = 0;
  const report: {
    id: string;
    title: string;
    applied: string[];
    missed: string[];
  }[] = [];

  for (const [id, fixes] of byId) {
    const doc = await client.fetch<{
      summary: string | null;
      description: Block[] | null;
      faqs: Faq[] | null;
    } | null>(`*[_id == $id][0]{summary, description, faqs}`, { id });
    if (!doc) {
      report.push({
        id,
        title: fixes[0]!.title,
        applied: [],
        missed: fixes.map((f) => f.from),
      });
      continue;
    }

    const applied: string[] = [];
    const missed: string[] = [];
    const patch: Record<string, unknown> = {};

    for (const fix of fixes) {
      if (fix.field === "summary") {
        if (doc.summary === fix.from) {
          patch.summary = fix.to;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      } else if (fix.field === "description") {
        const blocks =
          (patch.description as Block[] | undefined) ?? doc.description ?? [];
        let found = false;
        const next = blocks.map((b) => {
          if (b._type !== "block") return b;
          const text = (b.children ?? []).map((c) => c.text ?? "").join("");
          if (text !== fix.from) return b;
          found = true;
          return collapseBlock(b, fix.to);
        });
        if (found) {
          patch.description = next;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      } else if (fix.field === "faq") {
        const faqs = (patch.faqs as Faq[] | undefined) ?? doc.faqs ?? [];
        let found = false;
        const next = faqs.map((f) => {
          if (f.question !== fix.faqQuestion || f.answer !== fix.from) return f;
          found = true;
          return { ...f, answer: fix.to };
        });
        if (found) {
          patch.faqs = next;
          applied.push(fix.from);
        } else {
          missed.push(fix.from);
        }
      }
    }

    report.push({ id, title: fixes[0]!.title, applied, missed });
    if (apply && Object.keys(patch).length > 0) {
      transaction.patch(id, (p) => p.set(patch));
      queued++;
    }
  }

  for (const entry of report) {
    console.log(`\n==== ${entry.id} | ${entry.title}`);
    console.log(
      `  applied: ${entry.applied.length}, missed: ${entry.missed.length}`,
    );
    for (const m of entry.missed) console.log("  MISSED:", JSON.stringify(m));
  }

  const totalApplied = report.reduce((n, r) => n + r.applied.length, 0);
  const totalMissed = report.reduce((n, r) => n + r.missed.length, 0);
  console.log(`\nTotal: ${totalApplied} matched, ${totalMissed} missed.`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-hedge-fix-published.json`,
    JSON.stringify({ apply, queued, report }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
