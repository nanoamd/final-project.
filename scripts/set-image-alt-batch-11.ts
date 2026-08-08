/**
 * Batch 11 of the image alt-text pass — the images added since batch 10.
 *
 * Every image was downloaded and viewed at 700px before its description was
 * written; none is guessed from the filename or the product title. Where the
 * photograph is a dimensions diagram it says so, and where it shows a colourway
 * other than the one in the product name it names that colourway — all four
 * such products define it as a Colour option, so those photos are variants
 * rather than mistakes.
 *
 * Differences from batches 1-10, both learned from them:
 *   - Keyed by gallery index, not by whole array, so a product needing alt on
 *     images 4 and 5 only does not require the other four to be rewritten.
 *   - Patches every document with the slug, published and draft. Two of these
 *     products have unpublished copies, and patching only the one the old
 *     `[0]` query happened to return would put empty alt back on publish.
 *
 * Never overwrites existing alt text. Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-11.ts
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

/** slug → { gallery index: alt text } */
const ALT_TEXT: Record<string, Record<number, string>> = {
  "abberley-coffee-table-brown": {
    0: "Abberley brown oak coffee table with a glass top and lower shelf, styled beside a cream sofa on a jute rug",
    1: "Abberley brown oak coffee table, straight-on view of the glass top and slatted lower shelf",
    2: "Dimensions diagram for the Abberley coffee table: 1100 mm wide, 500 mm deep, 400 mm high, 220 mm above the shelf",
    3: "Abberley brown oak coffee table from above at an angle, the shelf's wood grain visible through the glass top",
    4: "Abberley coffee table in the white colourway, straight-on view of the glass top and lower shelf",
  },
  // Added while this batch was being written — the catalogue is growing daily,
  // which is the reason for scripts/audit-product-images.ts alongside this.
  "bentley-coffee-table-oak": {
    0: "Bentley coffee table in limed oak with four lift-out butler's trays on a folding X-frame base",
    1: "Close-up of the Bentley coffee table's limed oak tray edges and X-frame leg joint",
    2: "Bentley oak coffee table with four lift-out trays, angled view showing the folding X-frame base",
    3: "Dimensions diagram for the Bentley coffee table: 1200 mm square, 407 mm high, with four 550 mm trays",
  },
  "witley-coffee-table": {
    0: "Witley oak coffee table with a glass top and woven rattan shelf, styled beside a cream sofa on a wool rug",
    1: "Witley oak coffee table with a glass top and rattan lower shelf, straight-on studio view",
    2: "Witley oak coffee table with a glass top and rattan lower shelf, angled studio view",
    3: "Dimensions diagram for the Witley coffee table, labelled in millimetres",
  },
  "crofton-white-marble-coffee-table": {
    0: "Crofton round coffee table with a white marble top and geometric brushed-gold wire base",
    1: "Crofton round coffee table with a white marble top and geometric brushed-gold wire base",
    2: "Crofton round coffee table with a white marble top and geometric brushed-gold wire base",
    3: "Dimensions diagram for the Crofton coffee table: 1000 mm in diameter and 370 mm high",
  },
  "elmley-coffee-table-ivory": {
    0: "Elmley coffee table with a glass top, bronze frame and ivory shagreen shelf, straight-on studio view",
    1: "Elmley coffee table with a glass top and bronze frame, angled view showing the ivory shagreen shelf",
    2: "Elmley coffee table with a glass top, bronze frame and ivory shelf, low angled studio view",
    3: "Dimensions diagram for the Elmley coffee table: 1200 mm wide, 800 mm deep and 355 mm high",
    4: "Elmley coffee table in the grey colourway, with a glass top, bronze frame and grey shagreen shelf",
  },
  "overbury-coffee-table-chocolate-brown": {
    0: "Overbury coffee table with a chocolate-brown top and brushed-gold cross base, straight-on studio view",
    1: "Overbury coffee table with a chocolate-brown top and brushed-gold base, angled studio view",
    2: "Overbury coffee table with a chocolate-brown top and brushed-gold cross base, low angled view",
    3: "Close-up of the Overbury coffee table's chocolate-brown top and inlaid brass line",
    // Index 4 is deliberately absent: that gallery slot holds no image asset at
    // all. Alt text on an empty slot would only hide the real problem.
    5: "Dimensions diagram for the Overbury coffee table, labelled in millimetres",
  },
  "pershore-rectangular-aged-oak-coffee-table": {
    0: "Close-up of the Pershore coffee table's aged oak top and black steel cross frame",
    1: "Pershore coffee table with an aged oak tray top on a black X-frame base, straight-on studio view",
    2: "Pershore coffee table with an aged oak tray top and black X-frame base, angled studio view",
    3: "Dimensions diagram for the Pershore coffee table: 1100 mm wide, 800 mm deep and 400 mm high",
    4: "Pershore aged oak coffee table styled on a jute rug beside a linen sofa, with books and a vase on the tray top",
  },
  "large-brown-wooden-storage-tub": {
    0: "Large brown wooden storage tub with rope trim at the rim and base, on a whitewashed wooden floor",
    1: "Large brown wooden storage tub with rope-bound rim and base, studio view on white",
  },
  "brown-wooden-storage-crates-set-of-3": {
    4: "Set of three slatted wooden storage crates in the bluewash finish, stacked largest to smallest",
    5: "Set of three slatted wooden storage crates in the greenwash finish, stacked largest to smallest",
    6: "Set of three slatted wooden storage crates in the whitewash finish, two stacked and one stood on its side",
  },
  "natural-wooden-beer-barrel-storage-stool": {
    4: "Beer barrel storage stool in the whitewash finish, with a lift-off lid and riveted metal bands",
  },
  "set-of-3-gamal-wood-plant-stands-natural": {
    2: "Set of three gamal wood plant stands with live-edge tops and black hairpin legs, in the natural finish",
    5: "Set of three gamal wood plant stands with live-edge tops and black hairpin legs, in the greenwash finish",
  },
};

async function main() {
  let set = 0;
  let kept = 0;
  let missing = 0;

  for (const [slug, alts] of Object.entries(ALT_TEXT)) {
    const docs = await client.fetch<
      {
        _id: string;
        title: string;
        gallery: { alt?: string; hasAsset: boolean }[] | null;
      }[]
    >(
      `*[_type == "product" && slug.current == $slug]{
        _id, title,
        "gallery": gallery[]{alt, "hasAsset": defined(asset)}
      }`,
      { slug },
    );

    if (!docs.length) {
      console.warn(`✗ ${slug}: no product with this slug`);
      continue;
    }

    for (const doc of docs) {
      const draft = doc._id.startsWith("drafts.");
      const gallery = doc.gallery ?? [];
      const patch: Record<string, string> = {};

      for (const [indexKey, alt] of Object.entries(alts)) {
        const index = Number(indexKey);
        const image = gallery[index];
        if (!image) {
          console.warn(
            `  ⚠ ${slug}${draft ? " (draft)" : ""}: no image at index ${index} — skipped`,
          );
          missing++;
          continue;
        }
        // Batches 1-10 wrote descriptions by hand for other products; nothing
        // here should quietly replace one.
        if ((image.alt ?? "").trim()) {
          kept++;
          continue;
        }
        patch[`gallery[${index}].alt`] = alt;
      }

      const count = Object.keys(patch).length;
      if (!count) continue;
      if (apply) await client.patch(doc._id).set(patch).commit();
      console.log(
        `${apply ? "✓" : "·"} ${doc.title.slice(0, 52).padEnd(54)}${draft ? "[draft] " : "        "}${count} image(s)`,
      );
      set += count;
    }
  }

  console.log(
    `\n${set} alt text${set === 1 ? "" : "s"} ${apply ? "written" : "to write"}` +
      `${kept ? `, ${kept} left as they were` : ""}` +
      `${missing ? `, ${missing} slot(s) missing an image` : ""}.`,
  );
  if (!apply) console.log("Dry run — nothing written. Re-run with --apply.\n");
  else console.log("");
}

main().catch((err) => {
  console.error("set-image-alt-batch-11 failed:", err);
  process.exit(1);
});
