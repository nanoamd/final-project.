/**
 * Furniture To Go's published bathroom five-piece sets, as they appear on
 * their own trade site (furniture-to-go.co.uk) in September 2026.
 *
 * Damien: "furniture to go has accepted us too so we have plenty of bathroom
 * products now" — sent alongside a screenshot of this exact range. This file
 * is the factual half of importing it: SKU, EAN, packed dimensions, weight,
 * box count, finish and image, all taken from their public product pages.
 *
 * WHAT IS NOT HERE, AND WHY. `tradePrice` is null on every row. Furniture To
 * Go hide trade prices behind their account login — everything else on their
 * pages is public. This is the Mercia pattern repeated: import the facts now,
 * price the moment Damien pastes the trade list.
 *
 * SCOPE. Furniture To Go's bathroom range also includes individual cabinets,
 * mirrors and under-sink units sold separately (four category pages: Sets,
 * Cabinets, Mirrors, Under Sink) — around 30 more SKUs. This file covers only
 * the nine five-piece sets, one per collection except Veris (five finishes).
 * They are the hero, category-defining products; the individual pieces are a
 * natural follow-up, not done here.
 *
 * ONE SKU DELIBERATELY LEFT OUT. Their Ipsarion set has two URLs —
 * ipsarion-5-piece-bathroom-set.html (SKU 80FIPQZ111120p1) and
 * ...-white.html (SKU 80FIPQZ121120p1) — with identical dimensions, weight
 * and finish ("White with Silver Handles"). Almost certainly the same
 * physical product under two catalogue SKUs, not two colourways. Importing
 * both would risk listing a duplicate; only the unambiguous -white.html one
 * is here.
 *
 * A NOTE ON THE DIMENSIONS. Their pages label one figure "assembled
 * dimensions", and on a five-piece set spread across five boxes that figure
 * is plainly the largest packed carton, not an assembled room footprint —
 * 186.9 x 41.2 x 10.6cm is a flat box, not five pieces of bathroom furniture
 * standing in a room. The field here is named `largestBoxCm` and the specs
 * say so, rather than risk writing a wrong number onto a product page — the
 * same class of error already logged against the Mano Gold table lamp.
 *
 * CARRIAGE. Furniture To Go publish "free next day delivery" and "no MOQ" on
 * their own home page, and dropship direct to the customer. Unlike Mercia
 * (still BLOCKED per audit-supplier-readiness.ts), this is the first Hill/
 * Mercia/Aosom-era supplier whose carriage terms are confirmed in writing by
 * the supplier itself, not inferred — recorded on the supplier record as
 * `shippingRule: { kind: "included" }` with the source quoted in `notes`.
 */

/** One five-piece bathroom set on Furniture To Go's site. */
export interface FtgBathroomSet {
  /** Furniture To Go's own SKU, as printed on the product page. */
  sku: string;
  /** EAN barcode — goes to Sanity as `gtin`, which Google Shopping wants. */
  ean: string;
  /** Which of the five bathroom collections this belongs to. */
  collection: "Veris" | "Ipsarion" | "Ice Cave" | "Lokko" | "Alice Springs";
  /** Finish as they describe it, used verbatim in specs. */
  finish: string;
  /**
   * The distinguishing part of the finish, short enough for a title and slug.
   * Written by hand rather than derived from `finish` — the two Artisan Oak
   * variants (Light Grey doors vs. Sage Green doors) differ only in the part
   * a generic "take everything before the first comma" rule would drop,
   * which would give both the same title and the same slug.
   */
  shortFinish: string;
  /** Assembled weight in kg, from their page. Drives the two-man threshold. */
  weightKg: number;
  /** Number of cartons the product ships in. */
  boxes: number;
  /** The largest packed carton, W x H x D in cm — see the file header. */
  largestBoxCm: { w: number; h: number; d: number };
  /** The five pieces that make up the set, where their page itemises them. */
  pieces: string[];
  /** Their product page, kept as `sourceUrl` for provenance. */
  sourceUrl: string;
  /** Main catalogue image. */
  imageUrl: string;
  /** In stock, or the next delivery date they quote. */
  availability: string;
  /** Damien's trade price. Null until he supplies it — nothing invents this. */
  tradePrice: number | null;
}

/** Their Magento image cache prefix, stable across the catalogue. */
export const FTG_IMAGE_BASE =
  "https://furniture-to-go.co.uk/media/catalog/product/cache/5f54a2e317ebbd84d956b6a7d2b4c339";

const STANDARD_FIVE_PIECES = [
  "Vanity unit",
  "Mirrored cabinet",
  "Tall storage unit",
  "Wall cupboard",
  "Floor-standing cabinet",
];

export const FTG_BATHROOM_SETS: FtgBathroomSet[] = [
  {
    sku: "80FVERZ12Q34p1",
    ean: "5056920404492",
    collection: "Veris",
    finish: "Sonoma Oak & White High Gloss",
    shortFinish: "Sonoma Oak & White High Gloss",
    weightKg: 90.3,
    boxes: 5,
    largestBoxCm: { w: 186.9, h: 41.2, d: 10.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/veris-5-piece-bathroom-set-sonoma-oak-white-high-gloss.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fverz12q34p1_1_1.jpg`,
    availability: "In Stock",
    tradePrice: null,
  },
  {
    sku: "80FVERZ12U60p1",
    ean: "5056920404577",
    collection: "Veris",
    finish: "Sand, with black handles and feet",
    shortFinish: "Sand",
    weightKg: 90.3,
    boxes: 5,
    largestBoxCm: { w: 186.9, h: 41.2, d: 10.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/veris-5-piece-bathroom-set-sand.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fverz12u60p1_1.jpg`,
    availability: "In Stock",
    tradePrice: null,
  },
  {
    sku: "80FVERZ12M823p1",
    ean: "5056920404515",
    collection: "Veris",
    finish: "Artisan Oak with Light Grey doors, silver-effect handles",
    shortFinish: "Artisan Oak & Light Grey",
    weightKg: 90.3,
    boxes: 5,
    largestBoxCm: { w: 186.9, h: 41.2, d: 10.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/veris-5-piece-bathroom-set-artisan-oak-light-grey-doors.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fverz12m823p1_1.jpg`,
    availability: "In Stock",
    tradePrice: null,
  },
  {
    sku: "80FVERZ12C764p1",
    ean: "5056920404508",
    collection: "Veris",
    finish: "Walnut & Dark Grey",
    shortFinish: "Walnut & Dark Grey",
    weightKg: 90.3,
    boxes: 5,
    largestBoxCm: { w: 186.9, h: 41.2, d: 10.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/veris-5-piece-bathroom-set-walnut-dark-grey.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fverz12c764p1_1_1.jpg`,
    availability: "Next delivery 5 October 2026",
    tradePrice: null,
  },
  {
    sku: "80FVERZ12M888p1",
    ean: "5056920404522",
    collection: "Veris",
    finish: "Artisan Oak with Sage Green doors, silver-effect handles",
    shortFinish: "Artisan Oak & Sage Green",
    weightKg: 90.3,
    boxes: 5,
    largestBoxCm: { w: 186.9, h: 41.2, d: 10.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/veris-5-piece-bathroom-set-artisan-oak-sage-green-doors.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fverz12m888p1_1.jpg`,
    availability: "Next delivery 5 October 2026",
    tradePrice: null,
  },
  {
    sku: "80FIPQZ121120p1",
    ean: "5056920404539",
    collection: "Ipsarion",
    finish: "White, with metal handles and elevated legs",
    shortFinish: "White",
    weightKg: 85.3,
    boxes: 5,
    largestBoxCm: { w: 119.9, h: 40.6, d: 13 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/ipsarion-5-piece-bathroom-set-white.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fipqz121120p1_1.jpg`,
    availability: "In Stock",
    tradePrice: null,
  },
  {
    sku: "80FCQVZ121C857p1",
    ean: "5056920403945",
    collection: "Ice Cave",
    finish: "White & White High Gloss, chrome-effect handles",
    shortFinish: "White & White High Gloss",
    weightKg: 58.7,
    boxes: 5,
    largestBoxCm: { w: 199.2, h: 34.4, d: 6.9 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl:
      "https://furniture-to-go.co.uk/ice-cave-5-piece-bathroom-set.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80fcqvz121c857p1_2l.jpg`,
    availability: "Next delivery 4 September 2026",
    tradePrice: null,
  },
  {
    sku: "80FLKXZ121Z12p1",
    ean: "5056920404485",
    collection: "Lokko",
    finish: "White, silver handles, framed fronts",
    shortFinish: "White",
    weightKg: 76,
    boxes: 5,
    largestBoxCm: { w: 211.8, h: 42.4, d: 5.6 },
    pieces: STANDARD_FIVE_PIECES,
    sourceUrl: "https://furniture-to-go.co.uk/lokko-5-piece-bathroom-set.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80flkxz121z12p1_1.jpg`,
    availability: "Next delivery 5 October 2026",
    tradePrice: null,
  },
  {
    sku: "80FACSZ121U88p1",
    ean: "5056920403938",
    collection: "Alice Springs",
    finish: "Taupe, push-to-open fronts",
    shortFinish: "Taupe",
    weightKg: 109.5,
    boxes: 6,
    largestBoxCm: { w: 39.8, h: 191.9, d: 34.9 },
    pieces: [
      "Under sink vanity unit with 2 doors, push-to-open",
      "Hanging mirror cupboard with 3 doors, push-to-open",
      "Hanging storage cupboard with 1 door, push-to-open",
      "Low storage cabinet with 1 door and 1 drawer, push-to-open",
      "Tall narrow storage cabinet with 2 doors and 1 drawer, push-to-open",
    ],
    sourceUrl:
      "https://furniture-to-go.co.uk/alice-springs-5-piece-bathroom-set.html",
    imageUrl: `${FTG_IMAGE_BASE}/8/0/80facsz121u88p1_1.jpg`,
    availability: "Next delivery 4 September 2026",
    tradePrice: null,
  },
];
