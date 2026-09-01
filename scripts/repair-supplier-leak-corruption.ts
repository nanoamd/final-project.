/**
 * Emergency repair for a bug introduced by fix-supplier-name-leak.ts.
 *
 * That script rebuilt a changed description block as:
 *   children: [{ ...block.children[0], text: cleaned }, ...block.children.slice(1)]
 * `cleaned` was computed from the FULL concatenated text of every child in
 * the block, so children[0] already carries the complete, correct sentence.
 * But for any block that had more than one child (a common Portable Text
 * shape here — the original import split some sentences across multiple
 * spans with no marks difference), the original, uncleaned remaining
 * children got appended right after — producing duplicated text with the
 * supplier name still on the end of it. Confirmed live on "Bloom Collection
 * Outdoor Sofa" and others.
 *
 * The fix is safe and simple: for exactly the blocks this bug touched,
 * children[0].text already holds the complete correct content, so the
 * repair is to drop children[1:] and keep only children[0]. To find only
 * the blocks the bug touched (not legitimate, untouched multi-child blocks
 * like a "Diameter:" label + a bold "80cm" value elsewhere in the same
 * catalogue), this checks whether any child *after* the first still
 * contains the supplier's name — which only happens on a block this bug
 * corrupted, since the untouched pairs never mentioned the supplier at all.
 *
 *   pnpm tsx --env-file=.env.local scripts/repair-supplier-leak-corruption.ts
 *   pnpm tsx --env-file=.env.local scripts/repair-supplier-leak-corruption.ts --apply
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

const SUPPLIER_NAME_ANY =
  /\b(?:Hill Interiors|D\.?I\.?\s*Designs|Premier Housewares)\b/i;

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

async function main() {
  const rows = await client.fetch<
    { _id: string; title: string; description: Block[] | null }[]
  >(
    `*[_type == "product" && !(_id in path("drafts.**")) && title in [
      "Crofton White Marble Coffee Table | Kaiku",
      "13.6m Warm White Decorative LED String Lights | Kaiku",
      "2.75m\\\\9ft Plug-In LED 8 Sequence Warm White Cluster String | Kaiku",
      "7.2m Plug In LED Warm White Cluster Micro Lights | Kaiku",
      "Aegina Table Lamp | Kaiku",
      "Alto Putty Grey Outdoor Table | Kaiku",
      "Antia Stem Table Lamp With Linen Shade | Kaiku",
      "Antique Gold Hare Table Lamp With Green Velvet Shade | Kaiku",
      "Antique Gold Marching Hares Lamp With Green Velvet Shade | Kaiku",
      "Augusta Column Table Lamp With Linen Shade | Kaiku",
      "Black Wood Arched Window Mirror | Kaiku",
      "Bloom Collection Outdoor Footstool | Kaiku",
      "Bloom Collection Outdoor Sofa | Kaiku",
      "Capri Collection Outdoor Foot Stool | Kaiku",
      "Contour Collection 2 Drawer 2 Door Sideboard | Kaiku",
      "Contour Collection 3 Drawer Console | Kaiku",
      "Echo French Grey Chair | Kaiku",
      "Eucalyptus Plant In Stone Effect Pot | Kaiku",
      "Large Black Multi Shelf Unit | Kaiku",
      "Large Circular Silver Wall Hanging Multi Shelf | Kaiku",
      "Nahla Medium Mirror With Dimpled Frame | Kaiku",
      "Nahla Small Mirror With Dimpled Frame | Kaiku",
      "Provence Collection Outdoor 4 Seater Dining Set | Kaiku",
      "Provence Collection Outdoor Dining Chair | Kaiku",
      "Reed Collection 2 Drawer 2 Door Console | Kaiku",
      "Reed Collection 3 Drawer Bedside Table | Kaiku",
      "Saltaire Collection 3-Shelf Unit | Kaiku",
      "Sepia Shadows Squat Table Lamp With Linen Shade | Kaiku",
      "Seville Collection Lebes Planter | Kaiku",
      "Small Blue Flora Planter Pot | Kaiku",
      "Solenne Table Lamp with Edged Linen Shade | Kaiku",
      "Square Decorative Hanging Collage Mirror in Black | Kaiku",
      "Symi Slim Table Lamp | Kaiku",
      "Tarn Large Pot with Handles | Kaiku",
      "Teos Table Lamp | Kaiku",
      "Camden Half Moon 3 Tier Table | Kaiku",
      "Camden One Drawer Side Table | Kaiku",
      "Rutland Side Table | Kaiku",
      "Serene Rattan Coffee Table | Kaiku",
      "Twill Weave Ceramic Table Lamp with Linen Shade | Kaiku",
      "White Beaded Ceramic Table Lamp with Linen Shade | Kaiku"
    ]]{_id, title, description}`,
  );

  const transaction = client.transaction();
  let queued = 0;
  const report: { id: string; title: string; blocksRepaired: string[] }[] = [];

  for (const row of rows) {
    if (!row.description) continue;
    const blocksRepaired: string[] = [];
    let changedAny = false;
    const nextBlocks = row.description.map((block) => {
      const children = block.children ?? [];
      if (block._type !== "block" || children.length <= 1) {
        return block;
      }
      const corrupted = children
        .slice(1)
        .some((c) => SUPPLIER_NAME_ANY.test(c.text ?? ""));
      if (!corrupted) return block;
      changedAny = true;
      blocksRepaired.push(
        `"${children.map((c) => c.text).join("")}" -> "${children[0]?.text}"`,
      );
      return { ...block, children: [children[0]] };
    });

    if (changedAny) {
      report.push({ id: row._id, title: row.title, blocksRepaired });
      if (apply) {
        transaction.patch(row._id, (p) => p.set({ description: nextBlocks }));
        queued += 1;
      }
    }
  }

  for (const entry of report) {
    console.log(`\n==== ${entry.id} | ${entry.title}`);
    for (const b of entry.blocksRepaired) console.log("  -", b);
  }
  console.log(`\n${report.length} products with corrupted blocks found.`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products repaired.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-leak-corruption-repair.json`,
    JSON.stringify({ apply, queued, report }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
