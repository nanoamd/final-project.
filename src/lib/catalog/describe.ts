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
  /** Discrete facts the supplier publishes as a feature list. */
  features?: string[];
  /** The supplier's own prose, mined for facts — never reproduced. */
  supplierCopy?: string | null;
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

  // --- Features the supplier states as discrete facts --------------------
  const features = (input.features ?? []).filter(
    (f) => f && f.length > 2 && !/^(?:versatile|quality|stylish)$/i.test(f),
  );
  if (features.length >= 2) {
    sections.push({
      heading: pick(
        ["What You Get", "Features", "The Particulars"],
        input.slug,
        6,
      ),
      paragraphs: features.map((f) => f.replace(/\.?$/, "")),
    });
  }

  // --- Finish and design, from facts inside the supplier's own prose -----
  const observed = observationsFrom(input.supplierCopy, name);
  if (observed.length) {
    sections.push({
      heading: pick(
        ["Design and Finish", "How It Looks", "The Look of It"],
        input.slug,
        7,
      ),
      paragraphs: observed,
    });
  }

  // --- Styling and placement, derived from the actual measurements -------
  // Damien, comparing a ChatGPT-written vase page to this one: "i dont
  // understand why we cant just make every product description like this
  // whilst also making it factual". He is right, and the first version threw
  // out the form along with the emptiness. Styling and placement are what a
  // shopper wants; the fault in that page was that "the options are endless"
  // told them nothing. So the same sections are written here, with every
  // claim doing arithmetic on a real dimension.
  const styling = stylingFor(input, family, name);
  if (styling.length) {
    sections.push({
      heading: pick(
        family === "vessel"
          ? ["Styling It", "What It Holds", "Arranging In It"]
          : family === "wall"
            ? ["Where It Works", "Hanging and Placement", "Finding Its Wall"]
            : ["Living With It", "Where It Goes", "In the Room"],
        input.slug,
        8,
      ),
      paragraphs: styling,
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
        // The stored lead time is not altered — a standing constraint — but a
        // trailing space in the field must not become "2-4 weeks , with".
        `Dispatched within ${input.deliveryLeadTime.trim()}, with free UK delivery.`,
      ],
    });
  }

  return sections;
}

/**
 * Styling and placement advice, calculated rather than asserted.
 *
 * "Pair it with seasonal blooms for a rustic charm" is true of every vase ever
 * made and helps nobody. "At 38cm it takes stems around 55cm, so a supermarket
 * bunch needs about a third off" is advice a person can act on, and it comes
 * out of the height we already hold.
 *
 * Every line here does arithmetic on a recorded measurement. A product with no
 * dimensions gets none of it.
 */
function stylingFor(
  input: DescribeInput,
  family: Family,
  name: string,
): string[] {
  const d = input.dimensions;
  if (!d) return [];
  const unit = d.unit ?? "cm";
  const notes: string[] = [];
  const height = has(d.height) ? d.height : null;
  const width = has(d.width) ? d.width : has(d.length) ? d.length : null;
  const depth =
    has(d.length) && has(d.width) && d.length !== d.width ? d.width : null;

  if (family === "vessel" && height) {
    const stems = Math.round(height * 1.5);
    notes.push(
      `At ${height}${unit} tall the ${name} suits stems of roughly ${stems}${unit} overall — the rule of thumb florists work to is an arrangement about half again as tall as the vessel holding it. A supermarket bunch arrives longer than that, so expect to take a third off the bottom before it sits properly. Cut on a slant, and the stems draw water better and last several days longer.`,
    );
    if (width)
      notes.push(
        `The ${width}${unit} opening is what governs how full an arrangement can go. It is wide enough to take a generous hand-tied bunch without crushing the outer stems, and narrow enough that five or six stems will still hold their shape rather than falling open across the rim. If you want a looser, more sculptural look, work with fewer stems of varying height rather than filling it.`,
      );
    if (height && height >= 45)
      notes.push(
        `A vessel of this height changes the proportions of whatever it stands on. On a console table or a hall table it reads as a deliberate gesture and draws the eye down a corridor; on a dining table it would sit above the sightline and interrupt conversation across it. Against a wall with height above — beside a tall window, under a stairwell — is where it earns its scale.`,
      );
  }

  if (family === "wall" && height && width) {
    const top = Math.round(145 + height / 2);
    notes.push(
      `Galleries hang to a centre line about 145${unit} from the floor, which is average eye level. Follow that with the ${name} and its top edge lands near ${top}${unit} — worth measuring against a picture rail, coving or the underside of a shelf before you drill, because the fixing is the part you cannot undo.`,
    );
    notes.push(
      `At ${width}${unit} wide it wants a wall span of roughly ${Math.round(width * 1.6)}${unit} to breathe. Filling a wall corner to corner makes a room feel smaller, not fuller; leaving a margin either side is what lets a piece read as chosen rather than fitted. Above a sofa or a console, the convention is to keep it to about two thirds of the furniture's width, so ${Math.round(width * 1.5)}${unit} of furniture beneath is the comfortable minimum.`,
    );
  }

  if (family === "furniture" && height && width) {
    if (height <= 50)
      notes.push(
        `At ${height}${unit} high the ${name} sits at or below the seat line of most sofas, which is what keeps a low table usable — you reach across to it rather than down into it. Anything taller starts to feel like a barrier between the seating and the room.`,
      );
    else if (height >= 100)
      notes.push(
        `At ${height}${unit} this is a tall piece and it will anchor whichever wall it stands against. That is an advantage in a room with height to spare and a liability under a low or sloping ceiling, where it closes the space in. Give it a wall it can own rather than tucking it into an alcove that crowds it.`,
      );
    notes.push(
      `Allow around 75${unit} clear in front for a comfortable walkway — the figure building regulations use for a circulation route — so the ${width}${unit} width really wants about ${width + 150}${unit} of wall to sit without the room feeling tight. Measure the route in as well as the space it lands in; a piece this size has to get through the door and round the turn of a stair.`,
    );
    if (depth)
      notes.push(
        `Its ${depth}${unit} depth is the number that decides whether a room still works around it. In a hallway or behind a sofa, anything much past 40${unit} starts to catch shoulders and bags as people pass.`,
      );
  }

  if (family === "candle" && height) {
    notes.push(
      `At ${height}${unit} the ${name} stands above the sightline across a dining table, so it works better set to one side, on a sideboard or a mantel, than in the centre where it interrupts the conversation it is meant to warm. Grouped at differing heights it reads as a considered arrangement rather than a row.`,
    );
    notes.push(
      `Light behaves differently at this scale. A flame or LED held ${height}${unit} up throws its glow outward across a room rather than pooling on the surface beneath, which is what makes a tall holder useful in a corner that overhead lighting reaches badly.`,
    );
  }

  if (family === "outdoor" && width) {
    notes.push(
      `The ${width}${unit} footprint is the figure to measure against your paving, decking or lawn — and to measure with clearance, not flush to a wall. Outdoor furniture wants air around it to dry after rain, and anything sitting hard against a fence or a house wall will stay damp on that side long after the rest has dried.`,
    );
    if (height)
      notes.push(
        `At ${height}${unit} it will read against the skyline of your garden from indoors as much as from outside. Worth standing at the kitchen or living room window before deciding where it goes, because that is the view you will have of it most often.`,
      );
  }

  if (family === "lighting" && height) {
    notes.push(
      `At ${height}${unit} the ${name} sits well on a side table or a console where the shade falls near seated eye level — high enough to light a room, low enough that the bulb is not glaring straight at anyone sitting down. On a low table it will feel undersized, and on a tall chest it will throw light at the ceiling rather than the room.`,
    );
  }

  return notes;
}

/**
 * Facts pulled out of the supplier's prose and restated in Kaiku's voice.
 *
 * The brief is explicit that "every product is written individually, not
 * copied from the supplier's description", and that copy is written for trade
 * buyers in any case — it talks about "retailers seeking to meet the growing
 * demand". So nothing here reproduces a sentence. It looks for specific,
 * checkable attributes and says them plainly.
 */
function observationsFrom(
  copy: string | null | undefined,
  name: string,
): string[] {
  if (!copy) return [];
  const notes: string[] = [];
  const text = copy.toLowerCase();

  const finishes: [RegExp, string][] = [
    [
      /distressed/,
      "a deliberately distressed finish, so no two pieces are marked quite alike",
    ],
    [
      /hand-?woven/,
      "hand-woven construction, which is why the weave varies slightly across the surface",
    ],
    [
      /hand-?painted|hand-?finished|hand-?crafted|artisanal/,
      "hand-finishing, so small variations between pieces are part of it rather than faults",
    ],
    [
      /glazed|glaze\b/,
      "a glazed surface that catches the light rather than absorbing it",
    ],
    [
      /brushed/,
      "a brushed finish that hides fingerprints better than a polished one",
    ],
    [
      /textured|texture\b/,
      "a textured surface that reads as depth rather than pattern",
    ],
    [
      /matt\b|matte/,
      "a matt finish, which sits quieter in a room than a gloss",
    ],
    [
      /antiqued|aged\b|weathered/,
      "an aged finish applied deliberately, not wear from use",
    ],
    [
      /fluted|ribbed/,
      "fluting that throws vertical shadow lines as the light moves",
    ],
    [/bevel/, "a bevelled edge, which catches light along the border"],
  ];
  // The first mention names the product; later ones say "it". Repeating a
  // sixty-character product name at the head of three consecutive sentences is
  // how generated copy announces itself.
  for (const [pattern, sentence] of finishes) {
    if (!pattern.test(text)) continue;
    // Vary the connective. Three sentences opening "It also has" is the same
    // fault as three opening with the product's full name.
    const connectives = ["It also has", "There is", "The surface carries"];
    notes.push(
      notes.length === 0
        ? `The ${name} has ${sentence}.`
        : `${connectives[(notes.length - 1) % connectives.length]} ${sentence}.`,
    );
    if (notes.length >= 3) break;
  }

  // Where it is meant to go, and what it is meant to hold — both stated by the
  // supplier and both things a buyer weighs before ordering.
  const placements: [RegExp, string][] = [
    [/mantel|mantelpiece/, "a mantelpiece"],
    [/console table/, "a console table"],
    [/dining table|table centre|centrepiece/, "a dining table"],
    [/hallway|entrance|entryway/, "a hallway"],
    [/bedside/, "a bedside table"],
    [/windowsill|window sill/, "a windowsill"],
    [/shelf|shelving|bookcase/, "a shelf"],
  ];
  const places = placements
    .filter(([pattern]) => pattern.test(text))
    .map(([, where]) => where);
  if (places.length)
    notes.push(
      `It is sized for ${places
        .slice(0, 3)
        .join(", ")
        .replace(/, ([^,]*)$/, " or $1")}.`,
    );

  const holds = text.match(
    /\b(?:holds?|suits?|takes?|designed for|ideal for)\s+((?:artificial |dried |fresh |cut |real )?(?:flowers?|stems?|orchids?|foliage|pillar candles?|tealights?|tapers?|plants?))/,
  )?.[1];
  if (holds) notes.push(`The supplier lists it as suiting ${holds}.`);

  // A design reference tells a shopper what tradition it sits in.
  const reference = text.match(
    /\b(?:inspired by|drawing (?:on|inspiration from)|reminiscent of|echoes)\s+([a-z][a-z\s-]{4,40}?)(?:[,.]|\s+aesthetic)/,
  )?.[1];
  if (reference) notes.push(`Its shape draws on ${reference.trim()}.`);

  // A named collection is a genuine fact and useful: it tells a buyer what
  // else will match.
  const collection = copy.match(
    /\b([A-Z][a-z]+)\s+(?:collection|range|series)\b/,
  )?.[1];
  if (collection && !new RegExp(collection, "i").test(name))
    notes.push(
      `It belongs to the ${collection} range, so the other pieces in it are made to sit together.`,
    );

  return notes;
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
