/**
 * Corrects the Abberley coffee table's dimensions to the supplier's own figures.
 *
 * Stored:  120 x 60 x 40 cm
 * Diagram: 1100 x 500 x 400 mm  →  110 x 50 x 40 cm
 *
 * The diagram is image 2 in the product's own gallery, read at 1500px: 1100 mm
 * long, 500 mm deep, 400 mm high, with 220 mm of clearance above the lower
 * shelf and 120 mm of leg below it. Confirmed as correct by the owner.
 *
 * Length and depth were both out by 10 cm, which for a coffee table is the
 * difference between fitting a space and being returned at our cost.
 *
 * Checked, not assumed, for the rest of the range: Crofton (100 x 100 x 37),
 * Elmley (120 x 80 x 35.5) and Pershore (110 x 80 x 40) all match their
 * diagrams exactly. Bentley's 45 cm is also right — its diagram carries two
 * heights, 450 mm over the trays and 407 mm to the frame with the trays lifted
 * out. Witley's diagram is one of the 150px images and cannot be read.
 *
 * Dry run by default. Add --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/fix-abberley-dimensions.ts
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

const SLUG = "abberley-coffee-table-brown";
const EXPECT = { length: 120, width: 60, height: 40 };
const CORRECT = {
  _type: "dimensions" as const,
  length: 110,
  width: 50,
  height: 40,
  unit: "cm",
};

interface Doc {
  _id: string;
  title: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "product" && slug.current == $slug]{_id, title, dimensions}`,
    { slug: SLUG },
  );
  if (!docs.length) {
    console.error(`✗ no product with slug "${SLUG}" — aborting.`);
    process.exit(1);
  }

  const planned: Doc[] = [];
  for (const doc of docs) {
    const d = doc.dimensions ?? {};
    if (
      d.length === CORRECT.length &&
      d.width === CORRECT.width &&
      d.height === CORRECT.height
    )
      continue;
    // If it is neither the wrong value nor the right one, someone has edited it
    // since. Their figure may come from the supplier directly; don't overrule it.
    if (
      d.length !== EXPECT.length ||
      d.width !== EXPECT.width ||
      d.height !== EXPECT.height
    ) {
      console.error(
        `✗ ${doc._id}: expected ${EXPECT.length}x${EXPECT.width}x${EXPECT.height}, ` +
          `found ${d.length}x${d.width}x${d.height}. Edited since — leaving alone.`,
      );
      process.exit(1);
    }
    planned.push(doc);
  }

  if (!planned.length) {
    console.log("\nNothing to do — already correct.\n");
    return;
  }

  console.log("");
  for (const doc of planned) {
    const d = doc.dimensions ?? {};
    console.log(
      `  ${d.length} x ${d.width} x ${d.height} ${d.unit} → ` +
        `${CORRECT.length} x ${CORRECT.width} x ${CORRECT.height} ${CORRECT.unit}` +
        `   ${doc._id.startsWith("drafts.") ? "[draft] " : ""}${doc.title.slice(0, 40)}`,
    );
  }
  console.log("");

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }
  for (const doc of planned) {
    await client.patch(doc._id).set({ dimensions: CORRECT }).commit();
    console.log(`✓ ${doc.title.slice(0, 50)}`);
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("fix-abberley-dimensions failed:", err);
  process.exit(1);
});
