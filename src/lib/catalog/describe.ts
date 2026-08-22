/**
 * Builds a product description out of facts.
 *
 * The catalogue's drift was not that copy was generated — it was that the copy
 * contained nothing. A 1,105-word Glass Candle Holder listing never stated its
 * height, its diameter or what candle it takes. Length was standing in for
 * knowledge.
 *
 * So this inverts the order. It starts from the facts a product actually has
 * recorded and writes only sentences those facts support. A product with no
 * weight gets no sentence about weight; nothing is padded to reach a length.
 * That makes the output shorter than what it replaces — deliberately, and with
 * Damien's agreement: "a 250-word excellent description is better than a
 * 700-word AI-generated essay".
 *
 * **Three rules hold it to that.**
 *
 * 1. Every sentence traces to a recorded fact. There is no pool of filler
 *    sentences to fall back on, so a thin product produces short copy rather
 *    than invented copy.
 * 2. What matters differs by what the thing is. A planter needs drainage; a
 *    mirror needs fixings and weight; a fire pit needs fuel and weather. The
 *    families below carry those priorities, so a vase is not written like a bed.
 * 3. Wording varies by the product's own slug, so two lanterns with identical
 *    facts do not open with an identical sentence. The variation is
 *    deterministic — the same product always reads the same way, because copy
 *    that changed on refresh would be a hydration mismatch and would look like
 *    a fault.
 */

export type Family =
  | "vessel"
  | "candle"
  | "lighting"
  | "wall"
  | "furniture"
  | "outdoor"
  | "wellness";

/** Category title → writing family. */
const FAMILY_BY_CATEGORY: Record<string, Family> = {
  Vases: "vessel",
  Planters: "vessel",
  "Candles & Lanterns": "candle",
  Lighting: "lighting",
  "Garden Lighting": "outdoor",
  Mirrors: "wall",
  "Wall Art": "wall",
  "Wall Clocks": "wall",
  Furniture: "furniture",
  Storage: "furniture",
  Sofas: "furniture",
  "Console Tables": "furniture",
  "Coffee Tables": "furniture",
  "Side Tables": "furniture",
  "Bedside Tables": "furniture",
  "TV Units": "furniture",
  Beds: "furniture",
  Desks: "furniture",
  Shelving: "furniture",
  "The Reclaimed Collection": "furniture",
  "Garden Furniture": "outdoor",
  "Fire Pits & Heating": "outdoor",
  Pergolas: "outdoor",
  "Water Features": "outdoor",
  "Privacy Screens": "outdoor",
  "Outdoor Kitchens": "outdoor",
  "Christmas Decorations": "wall",
  "Christmas Trees": "furniture",
  Accessories: "vessel",
  "Wellness Accessories": "wellness",
  "Outdoor Saunas": "wellness",
  "Indoor Saunas": "wellness",
  "Cold Plunges": "wellness",
};

export function familyFor(category?: string | null): Family {
  return FAMILY_BY_CATEGORY[category ?? ""] ?? "furniture";
}

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface DescribeInput {
  title: string;
  slug: string;
  category?: string | null;
  dimensions?: Dimensions | null;
  weight?: { value?: number; unit?: string } | null;
  material?: string | null;
  colour?: string | null;
  /** Labelled specifications harvested from the supplier's own page. */
  extra?: Record<string, string>;
  deliveryLeadTime?: string | null;
  /** Set when the name and the supplier disagree; suppresses material claims. */
  materialDisputed?: boolean;
}

export interface Section {
  heading: string;
  paragraphs: string[];
}

/** Deterministic index from a slug, so wording varies but never changes. */
function pick<T>(options: readonly T[], slug: string, salt: number): T {
  let hash = salt;
  for (let i = 0; i < slug.length; i++)
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return options[hash % options.length]!;
}

const has = (n: unknown): n is number => typeof n === "number" && n > 0;

/** "33cm tall and 14cm across", or null when nothing is recorded. */
function measure(d: Dimensions | null | undefined): string | null {
  if (!d) return null;
  const unit = d.unit ?? "cm";
  if (has(d.height) && has(d.width) && has(d.length)) {
    return d.width === d.length
      ? `${d.height}${unit} tall and ${d.width}${unit} across`
      : `${d.length} × ${d.width} × ${d.height}${unit} (length × width × height)`;
  }
  const parts: string[] = [];
  if (has(d.height)) parts.push(`${d.height}${unit} tall`);
  if (has(d.length)) parts.push(`${d.length}${unit} long`);
  if (has(d.width)) parts.push(`${d.width}${unit} wide`);
  return parts.length ? parts.join(" and ") : null;
}

/** The name as it should read in a sentence. */
function displayName(title: string): string {
  return title.replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "").trim();
}

/**
 * What a buyer of this kind of thing most needs settled, worst-case first.
 * Returns sentences; anything unsupported by a fact is simply absent.
 */
function practicalNotes(input: DescribeInput, family: Family): string[] {
  const notes: string[] = [];
  const name = displayName(input.title);
  const extra = input.extra ?? {};
  const weight = input.weight?.value;
  const unit = input.weight?.unit ?? "kg";

  const indoorOutdoor = extra["Indoor Outdoor Use"];
  const assembly = extra["Assembly Required"];
  const candleType = extra["Candle Type"];
  const battery = extra["Battery Type"];
  const warning = extra["Product Warning"];

  if (family === "candle" && candleType) {
    notes.push(
      /led|faux/i.test(candleType)
        ? `This is made for LED and faux candles rather than a live flame — the ${name} is not designed to hold a burning wick.`
        : candleType,
    );
  }

  if (family === "wall" && has(weight)) {
    notes.push(
      weight >= 10
        ? `At ${weight}${unit} this needs a fixing rated for the weight and, ideally, a stud or masonry rather than plasterboard alone.`
        : `At ${weight}${unit} it hangs on standard fixings suited to your wall type.`,
    );
  }

  if (family === "vessel") {
    notes.push(
      `The ${name} has no drainage hole drilled, so it suits a plant kept in its nursery pot or cut stems in water.`,
    );
  }

  if ((family === "furniture" || family === "outdoor") && assembly) {
    notes.push(
      /^no\b/i.test(assembly)
        ? `It arrives assembled and ready to use.`
        : `Assembly is required, and the fixings and instructions are supplied.`,
    );
  }

  if (family === "outdoor" && indoorOutdoor) {
    notes.push(
      /indoor only/i.test(indoorOutdoor)
        ? `Despite the setting it suits, this is an indoor piece and should not be left out in the weather.`
        : /fair weather/i.test(indoorOutdoor)
          ? `It is suited to sheltered outdoor use in fair weather, and will last longer brought in or covered over winter.`
          : indoorOutdoor,
    );
  }

  if (family === "lighting" && battery) {
    notes.push(
      `Power comes from ${battery.toLowerCase().replace(/\s*\(included\)/i, "")}${/\(included\)/i.test(battery) ? ", supplied with it" : ", not supplied"}.`,
    );
  }

  if (has(weight) && (family === "furniture" || family === "outdoor")) {
    notes.push(
      weight >= 25
        ? `It weighs ${weight}${unit}, which is a two-person lift — worth arranging help for the day it arrives.`
        : `It weighs ${weight}${unit}, light enough for one person to position.`,
    );
  }

  if (warning) notes.push(warning.replace(/\.?$/, "."));

  return notes;
}

/**
 * The finished description, as sections.
 *
 * Returns an empty array when there is nothing worth saying — a product with
 * no dimensions, no weight, no material and no specifications produces no
 * copy at all, which is the correct outcome and the one that keeps this from
 * becoming the generator it replaces.
 */
export function describeProduct(input: DescribeInput): Section[] {
  const family = familyFor(input.category);
  const name = displayName(input.title);
  const sections: Section[] = [];
  const size = measure(input.dimensions);
  const material =
    input.materialDisputed || !input.material
      ? null
      : input.material.toLowerCase();

  // --- Opening: what it is, and its one hard fact ------------------------
  const openers = [
    (m: string, s: string) =>
      `The ${name} is made from ${m} and measures ${s}.`,
    (m: string, s: string) => `Made from ${m}, the ${name} measures ${s}.`,
    (m: string, s: string) => `In ${m}, the ${name} measures ${s}.`,
  ] as const;

  if (material && size) {
    sections.push({
      heading: pick(
        ["Materials and Measurements", "What It Is", "Construction and Size"],
        input.slug,
        1,
      ),
      paragraphs: [pick(openers, input.slug, 2)(material, size)],
    });
  } else if (size) {
    sections.push({
      heading: pick(["Measurements", "Size", "Dimensions"], input.slug, 1),
      paragraphs: [`The ${name} measures ${size}.`],
    });
  } else if (material) {
    sections.push({
      heading: "Materials",
      paragraphs: [`The ${name} is made from ${material}.`],
    });
  }

  // --- Specifications the supplier publishes -----------------------------
  // Anything the practical notes will state in a sentence is left out of the
  // specification list: printing "Candle Type: Use With LED Faux Candles Only"
  // and then explaining it two lines later reads as a stutter.
  const spokenLabels = new Set([
    "Product Warning",
    "Candle Type",
    "Assembly Required",
    "Indoor Outdoor Use",
    "Battery Type",
  ]);
  const specLines = Object.entries(input.extra ?? {})
    .filter(([label]) => !spokenLabels.has(label))
    .map(([label, value]) => `${label}: ${value}`);
  if (specLines.length) {
    sections.push({
      heading: pick(
        ["Specification", "The Detail", "Specifics"],
        input.slug,
        3,
      ),
      paragraphs: specLines,
    });
  }

  // --- What a buyer needs settled ----------------------------------------
  const notes = practicalNotes(input, family);
  if (notes.length) {
    sections.push({
      heading: pick(
        family === "wall"
          ? ["Hanging It", "Fixing and Placement", "Putting It Up"]
          : family === "outdoor"
            ? [
                "Outdoors and Overwintering",
                "Weather and Use",
                "Living Outside",
              ]
            : family === "candle"
              ? ["Safe Use", "Using It", "Candles and Care"]
              : ["Before You Order", "Practical Notes", "Worth Knowing"],
        input.slug,
        4,
      ),
      paragraphs: notes,
    });
  }

  // --- Care, where the material implies it -------------------------------
  const care = careFor(material);
  if (care) {
    sections.push({
      heading: pick(
        ["Looking After It", "Care", "Keeping It Well"],
        input.slug,
        5,
      ),
      paragraphs: [care],
    });
  }

  // --- Delivery, only where the lead time is real ------------------------
  if (input.deliveryLeadTime) {
    sections.push({
      heading: "Delivery",
      paragraphs: [
        `Dispatched within ${input.deliveryLeadTime}, with free UK delivery.`,
      ],
    });
  }

  return sections;
}

/**
 * How a material is looked after.
 *
 * This is general knowledge about the substance, not a claim about the
 * product — teak greys outdoors whoever made it. Materials with nothing
 * particular to say return null rather than a line of filler.
 */
function careFor(material: string | null): string | null {
  if (!material) return null;
  if (/teak|acacia|mango|oak|elm|pine|wood/.test(material))
    return "Wipe with a barely damp cloth and dry it off; standing water is what lifts a timber finish. Keep it out of direct sun and away from a radiator, both of which dry the grain and open it up.";
  if (/ceramic|porcelain|stoneware|clay/.test(material))
    return "Wash by hand in warm water rather than a dishwasher, whose detergents dull a glaze over time. Glazed ceramic chips at the rim if knocked against a tap, so set it down rather than resting it on the edge.";
  if (/glass|mirror|crystal/.test(material))
    return "Clean with a soft cloth and a little glass cleaner sprayed onto the cloth, not onto the piece — liquid running into a seam or a frame is what marks it.";
  if (/stone|marble|granite|concrete/.test(material))
    return "Wipe with a damp cloth and avoid anything acidic, including vinegar and citrus cleaners, which etch a stone surface permanently.";
  if (/metal|iron|steel|brass|chrome|nickel/.test(material))
    return "Dust with a dry cloth. Damp left sitting on a metal finish is what starts a spot of corrosion, so dry it if it gets wet.";
  if (/rattan|wicker|bamboo|jute|seagrass/.test(material))
    return "Dust with a soft brush, getting into the weave where it collects. Woven fibres go brittle if they dry out completely, so keep it away from direct heat.";
  return null;
}

/** Word count of a built description, for the length ceiling. */
export function wordsIn(sections: Section[]): number {
  return sections
    .flatMap((s) => [s.heading, ...s.paragraphs])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
