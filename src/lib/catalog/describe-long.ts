/**
 * The long-form product description, in the shape Kaiku already had.
 *
 * Damien pointed at the Sorelle Two Seater Sofa — 1,628 words — and asked for
 * the pergola to read exactly like it. Reading that page carefully, its length
 * comes from a repeated move rather than from padding: a short prose section
 * that says something specific, followed by a themed list. "Perfect for:"
 * eighteen settings. "Pair it with:" eleven materials. "Position it alongside:"
 * seven pieces.
 *
 * Those lists are the engine, and they are honest. A list of rooms a two-seater
 * sofa suits makes no claim that can be false, and it carries the long-tail
 * phrases a shopper actually searches. The prose between them is where the
 * measurements go.
 *
 * So this builds the same structure from what each product records. Where the
 * Sorelle says "its generously proportioned 197 cm width", a pergola says its
 * 397cm span and what that covers. Nothing is invented; the lists are drawn
 * from the product's family and material, and every number is one we hold.
 */

import { sitingFor } from "./context-check";
import { type Family, familyFor } from "./describe";
import { FACT_PATTERN } from "./quality";

export interface LongFormInput {
  title: string;
  slug: string;
  category?: string | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  weight?: { value?: number; unit?: string } | null;
  material?: string | null;
  colour?: string | null;
  extra?: Record<string, string>;
  features?: string[];
  deliveryLeadTime?: string | null;
  materialDisputed?: boolean;
}

export interface LongSection {
  heading: string;
  paragraphs: string[];
  /** Rendered as a bulleted run beneath the paragraphs. */
  list?: { intro: string; items: string[] };
  /**
   * A closing line that belongs *after* the list, not before it. The Sorelle
   * page ends most sections this way — the list, then one sentence that tells
   * you what to do with it — and pushing it into `paragraphs` puts it in the
   * wrong place entirely.
   */
  close?: string;
  /**
   * A styling section that earns its place only if the page as a whole is
   * dense enough with fact to justify the length. Trimmed by `trimToSubstance`
   * below, back to front, when it is not.
   */
  optional?: boolean;
}

const has = (n: unknown): n is number => typeof n === "number" && n > 0;

/** Title Case for a heading built from a data value: "dark grey" → "Dark Grey". */
function title(value: string): string {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * A colour value as it should read in a sentence.
 *
 * Harvested colours arrive as compound strings — "grey, white", "black/brown"
 * — and interpolating one raw produced "The grey, white finish gives the
 * Marble Effect Olpe Vase a versatile foundation", which reads like a database
 * field and trips the colour checker into reporting a contradiction with
 * itself.
 */
export function formatColour(colour: string): string {
  const parts = colour
    .split(/\s*(?:,|\/|\band\b)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return colour.trim();
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Facts that are safe to put in front of a customer.
 *
 * Harvested feature lists and specification values are supplier data, and some
 * of it carries HTML tags, unclosed brackets, or a stray sentence from a
 * different product. Interpolating those straight into copy is how "8 ( against
 * 1 )" and a literal &nbsp; reached the page. Anything that fails is dropped
 * rather than repaired: we do not know what it was meant to say.
 */
export function usableFact(value: string): boolean {
  if (!value || value.trim().length < 3) return false;
  if (/<\/?[a-z][^>]*>|&(?:amp|nbsp|quot|lt|gt|#\d+);/i.test(value))
    return false;
  const opens = (value.match(/\(/g) ?? []).length;
  const closes = (value.match(/\)/g) ?? []).length;
  if (opens !== closes) return false;
  if (/\s[,.;:]/.test(value)) return false;
  return true;
}

/**
 * The dominant material, from a supplier composition string.
 *
 * Harvested material arrives as "mdf 10%, mirror 40%, oak wood 50%" or
 * "foam 45%,velvet 10%,gold electroplating hardware leg 5%,solid eucalyptus
 * 40%". Interpolated raw it produced "brings together mdf 10%, mirror 40%, oak
 * wood 50% construction", which reads like a spreadsheet cell and made the copy
 * describe a grey sofa as gold. The largest component is what a shopper means
 * when they ask what a thing is made of.
 */
export function dominantMaterial(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parts = [
    ...cleaned.matchAll(/([a-z][a-z\s-]*?)\s*(\d+(?:\.\d+)?)\s*%/gi),
  ];
  if (parts.length) {
    // "gold electroplating hardware leg" is a component, not a material a
    // sentence can carry, so the largest *usable* component wins rather than
    // simply the largest. Falling back to the next one down says something
    // true; returning nothing throws away a fact we hold.
    const usable = parts
      .map((part) => ({
        name: part[1]!.trim().replace(/^[,;]+|[,;]+$/g, ""),
        share: Number(part[2]),
      }))
      .filter((part) => part.name && part.name.split(/\s+/).length <= 3)
      .sort((a, b) => b.share - a.share);
    return usable[0]?.name ?? null;
  }
  if (/[,;/]/.test(cleaned)) {
    const first = cleaned.split(/[,;/]/)[0]!.trim();
    return first && first.split(/\s+/).length <= 3 ? first : null;
  }
  return cleaned.split(/\s+/).length <= 3 ? cleaned : null;
}

/** "a" or "an", by the sound of the word that follows. */
export function articleFor(word: string, capitalised = false): string {
  const vowelSound =
    /^[aeiou]/i.test(word) && !/^(?:uni|use|user|one|once|euro)/i.test(word);
  const article = vowelSound ? "an" : "a";
  return capitalised ? article[0]!.toUpperCase() + article.slice(1) : article;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function displayName(title: string): string {
  // Some titles carry "&amp;" from the import. The title is Damien's to change,
  // but reproducing the entity inside the description puts it on the page twice.
  let name = title.replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "").trim();
  for (const [entity, character] of Object.entries(ENTITIES))
    name = name.split(entity).join(character);
  return name;
}

/**
 * The name to use after the first mention.
 *
 * The Sorelle page says "the Sorelle" once it has introduced itself, and that
 * is why it reads as prose rather than as a generator repeating a 60-character
 * string. The first attempt at this took the first word whenever it looked
 * like a range name — capitalised, four letters or more — which introduced
 * "Sweet Birch Essential Oil 50ml" as **"the Sweet"**, and did the same to
 * every product whose name happens to start with an adjective.
 *
 * There is no reliable way to tell a range name from an ordinary English word
 * without a dictionary, so this no longer tries. It keeps up to four words and
 * trims anything left dangling, which gives "the Sorelle Two Seater Sofa" and
 * "the Lean-To Steel Pergola" — slightly longer than the ideal, and never
 * wrong. A name is the one thing a shopper is certain to notice us getting
 * wrong.
 */
export function shortName(full: string): string {
  const beforeComma = full.split(",")[0]!.trim();
  const words = beforeComma.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return beforeComma;

  const isConnector = (word: string) =>
    /^(?:with|and|in|for|on|of|the|a|an|&|to|by|from|plus|featuring|including)$/i.test(
      word,
    );

  // Cut at a joining word or not at all. "Lean-To Steel Pergola with Sliding
  // Canopy" shortens cleanly at "with"; "Large Conical Ceramic Lattice
  // Hurricane Lantern" has no such seam, and taking the first four words of it
  // produces "Large Conical Ceramic Lattice" — a name that drops the noun
  // telling you what the thing is. Repeating a slightly long name costs a
  // little elegance. Inventing a wrong one costs the reader's trust.
  const joint = words.findIndex(isConnector);
  if (joint >= 3) return words.slice(0, joint).join(" ");
  return beforeComma;
}

/**
 * The product name with its definite article, without doubling it.
 *
 * "The Rutland Collection Rectangular Dining Table" already carries its "The",
 * so `The ${name}` produced "The The Rutland Collection". Ten products in
 * Furniture read that way in the first catalogue run.
 */
export function withThe(name: string, capitalised: boolean): string {
  const article = capitalised ? "The" : "the";
  return /^the\s/i.test(name)
    ? capitalised
      ? name
      : name.replace(/^The\s/, "the ")
    : `${article} ${name}`;
}

function pick<T>(options: readonly T[], slug: string, salt: number): T {
  let hash = salt;
  for (let i = 0; i < slug.length; i++)
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return options[hash % options.length]!;
}

/** Where a thing of this kind belongs. Long, because the list is the point. */
const SETTINGS: Record<Family, string[]> = {
  outdoor: [
    "Patios",
    "Terraces",
    "Decking",
    "Courtyard gardens",
    "Roof terraces",
    "Balconies",
    "Poolside areas",
    "Outdoor dining areas",
    "Garden seating areas",
    "Hot tub surrounds",
    "Barbecue and kitchen areas",
    "Holiday lets",
    "Boutique hotels",
    "Restaurant terraces",
    "Garden offices",
    "Allotment and greenhouse plots",
    "Show gardens",
    "Landscaping projects",
  ],
  furniture: [
    "Living rooms",
    "Lounge areas",
    "Apartments",
    "Open-plan living spaces",
    "Guest rooms",
    "Bedrooms",
    "Reading areas",
    "Home offices",
    "Conservatories",
    "Boutique hotels",
    "Serviced apartments",
    "Show homes",
    "Premium rental properties",
    "Interior design projects",
    "Reception areas",
  ],
  vessel: [
    "Console tables",
    "Hallway tables",
    "Mantelpieces",
    "Dining tables",
    "Kitchen islands",
    "Windowsills",
    "Shelving and bookcases",
    "Bedside tables",
    "Home offices",
    "Reception desks",
    "Show homes",
    "Boutique hotels",
    "Restaurant tables",
    "Interior design projects",
  ],
  candle: [
    "Mantelpieces",
    "Dining tables",
    "Console tables",
    "Coffee tables",
    "Windowsills",
    "Hallways",
    "Bathrooms",
    "Bedrooms",
    "Conservatories",
    "Covered terraces",
    "Restaurant tables",
    "Boutique hotels",
    "Show homes",
    "Wedding and event styling",
  ],
  lighting: [
    "Living rooms",
    "Bedrooms",
    "Hallways",
    "Home offices",
    "Reading corners",
    "Side tables",
    "Console tables",
    "Sideboards",
    "Landings",
    "Snugs",
    "Boutique hotels",
    "Serviced apartments",
    "Show homes",
    "Reception areas",
  ],
  wall: [
    "Living rooms",
    "Hallways",
    "Stairwells",
    "Bedrooms",
    "Dining rooms",
    "Home offices",
    "Landings",
    "Cloakrooms",
    "Boutique hotels",
    "Reception areas",
    "Show homes",
    "Restaurants and bars",
    "Interior design projects",
  ],
  wellness: [
    "Garden wellness spaces",
    "Home gyms",
    "Spa rooms",
    "Poolside areas",
    "Holiday lets",
    "Boutique hotels",
    "Retreat centres",
    "Treatment rooms",
    "Recovery studios",
    "Private members' clubs",
  ],
};

/** Materials that sit well beside this one. */
const MATERIAL_PAIRINGS: Record<string, string[]> = {
  wood: [
    "Linen",
    "Wool",
    "Bouclé",
    "Rattan",
    "Jute",
    "Travertine",
    "Marble",
    "Aged brass",
    "Blackened steel",
    "Woven rugs",
    "Ceramic accessories",
  ],
  metal: [
    "Natural timber",
    "Oak",
    "Walnut",
    "Linen",
    "Leather",
    "Marble",
    "Travertine",
    "Woven rugs",
    "Ceramic accessories",
    "Glass",
    "Stone",
  ],
  glass: [
    "Natural timber",
    "Aged brass",
    "Blackened steel",
    "Linen",
    "Marble",
    "Travertine",
    "Ceramic accessories",
    "Woven textures",
    "Stone",
  ],
  ceramic: [
    "Natural timber",
    "Linen",
    "Wool",
    "Jute",
    "Rattan",
    "Aged brass",
    "Travertine",
    "Dried grasses",
    "Woven rugs",
    "Stone",
  ],
  stone: [
    "Natural timber",
    "Oak",
    "Linen",
    "Wool",
    "Aged brass",
    "Blackened steel",
    "Woven rugs",
    "Ceramic accessories",
    "Leather",
  ],
  rattan: [
    "Natural timber",
    "Linen",
    "Cotton",
    "Jute",
    "Ceramic accessories",
    "Aged brass",
    "Stone",
    "Woven rugs",
    "Dried grasses",
  ],
  fabric: [
    "Natural timber",
    "Oak",
    "Walnut",
    "Rattan",
    "Travertine",
    "Marble",
    "Woven rugs",
    "Ceramic accessories",
    "Natural stone",
    "Aged brass",
  ],
};

/**
 * Outdoor equivalents.
 *
 * The indoor table above pairs steel with linen, leather and marble, which is
 * right for a console table and wrong for a pergola. Anything in the outdoor
 * family gets pairings that survive a British winter.
 */
const OUTDOOR_PAIRINGS: Record<string, string[]> = {
  metal: [
    "Natural timber",
    "Teak",
    "Slate",
    "Gravel",
    "Natural stone",
    "Porcelain paving",
    "Corten steel",
    "Outdoor rope and weave",
    "Terracotta",
    "Architectural grasses",
    "Climbing planting",
  ],
  wood: [
    "Blackened steel",
    "Natural stone",
    "Slate",
    "Gravel",
    "Terracotta",
    "Outdoor rope and weave",
    "Architectural grasses",
    "Brick",
    "Climbing planting",
  ],
  stone: [
    "Natural timber",
    "Teak",
    "Blackened steel",
    "Gravel",
    "Terracotta",
    "Architectural grasses",
    "Outdoor rope and weave",
    "Climbing planting",
  ],
  rattan: [
    "Natural timber",
    "Teak",
    "Gravel",
    "Terracotta",
    "Outdoor rope and weave",
    "Architectural grasses",
    "Natural stone",
  ],
  ceramic: [
    "Natural timber",
    "Gravel",
    "Slate",
    "Terracotta",
    "Architectural grasses",
    "Natural stone",
    "Outdoor rope and weave",
  ],
  glass: [
    "Blackened steel",
    "Natural timber",
    "Slate",
    "Gravel",
    "Natural stone",
    "Architectural grasses",
  ],
  fabric: [
    "Natural timber",
    "Teak",
    "Blackened steel",
    "Gravel",
    "Terracotta",
    "Outdoor rope and weave",
    "Architectural grasses",
  ],
};

/** Colours and finishes that sit well beside this one. */
const COLOUR_PAIRINGS: Record<string, string[]> = {
  grey: [
    "Warm beige",
    "Cream",
    "Taupe",
    "Natural oak",
    "Walnut",
    "Black accents",
    "Brass",
    "Travertine",
    "Muted greens",
    "Soft blues",
    "Charcoal",
  ],
  black: [
    "Warm beige",
    "Cream",
    "Natural oak",
    "Walnut",
    "Brass",
    "Bronze",
    "Travertine",
    "Marble",
    "Muted greens",
    "Deep terracotta",
  ],
  white: [
    "Warm beige",
    "Cream",
    "Taupe",
    "Soft grey",
    "Natural oak",
    "Walnut",
    "Black accents",
    "Brass",
    "Earthy tones",
    "Muted greens",
    "Soft blues",
  ],
  cream: [
    "Natural oak",
    "Walnut",
    "Soft grey",
    "Taupe",
    "Brass",
    "Bronze",
    "Terracotta",
    "Muted greens",
    "Woven textures",
    "Natural stone",
  ],
  brown: [
    "Cream",
    "Warm beige",
    "Soft grey",
    "Brass",
    "Bronze",
    "Muted greens",
    "Deep blues",
    "Woven textures",
    "Natural stone",
  ],
  natural: [
    "Cream",
    "Warm beige",
    "Soft grey",
    "Black accents",
    "Brass",
    "Muted greens",
    "Terracotta",
    "Woven textures",
    "Natural stone",
  ],
  green: [
    "Cream",
    "Warm beige",
    "Natural oak",
    "Brass",
    "Terracotta",
    "Charcoal",
    "Woven textures",
    "Natural stone",
  ],
  beige: [
    "Cream",
    "Soft grey",
    "Natural oak",
    "Walnut",
    "Black accents",
    "Brass",
    "Muted greens",
    "Terracotta",
    "Woven textures",
  ],
};

/** Five named styling directions for a garden piece. */
const OUTDOOR_STYLING: { name: string; how: string }[] = [
  {
    name: "Neutral styling",
    how: "Cream, beige and taupe across paving, gravel and outdoor fabric, with planting kept green rather than floral.",
  },
  {
    name: "Natural styling",
    how: "Timber, rope and woven outdoor textures alongside grasses and loose, informal planting.",
  },
  {
    name: "Contemporary styling",
    how: "Monochrome hard landscaping, linear lighting and a restrained palette of two or three colours.",
  },
  {
    name: "Coastal styling",
    how: "Bleached timber, shingle, off-whites and drought-tolerant planting, kept light and open.",
  },
  {
    name: "Modern classic styling",
    how: "Sandstone, aged brass lanterns, clipped evergreen structure and climbing roses.",
  },
];

/** Five named styling directions, as the Sorelle page does. */
const STYLING_DIRECTIONS: { name: string; how: string }[] = [
  {
    name: "Neutral styling",
    how: "Cream, beige and taupe tones with a textured throw or rug to keep the scheme from flattening out.",
  },
  {
    name: "Natural styling",
    how: "Linen, jute and woven fabrics alongside earthy tones and unfinished timber.",
  },
  {
    name: "Contemporary styling",
    how: "Monochrome accents, sculptural lighting and a restrained palette of two or three colours.",
  },
  {
    name: "Coastal styling",
    how: "Soft blues, off-whites and natural woven textures, kept light and uncrowded.",
  },
  {
    name: "Modern classic styling",
    how: "Velvet, brass accents and considered artwork, with warmth carried by timber.",
  },
];

/**
 * One line on why each pairing material works.
 *
 * The Sorelle page has a "Natural Material Pairings" section that names six
 * materials and says something specific about each. That is more useful than a
 * bare list, and it is where a shopper deciding between two finishes actually
 * gets help, so the notes are keyed by the same names the pairing lists use.
 */
const PAIRING_NOTES: Record<string, string> = {
  "Natural timber":
    "Introduces warmth and visible grain against a harder finish.",
  Oak: "Pale and open-grained, it keeps a scheme feeling light.",
  Walnut: "Darker and richer, for schemes that want more depth.",
  Linen: "A soft, slightly irregular texture that stops a scheme reading flat.",
  Wool: "Warmth, and a matte surface that absorbs light rather than bouncing it back.",
  Bouclé: "Soft and sculptural, a contemporary counterpoint to straight lines.",
  Leather: "Ages visibly and takes on character rather than wearing out.",
  Rattan: "Relaxed, coastal and organic in character.",
  Jute: "An honest natural texture that grounds a lighter palette.",
  Travertine:
    "A sophisticated contemporary combination with real visible depth.",
  Marble: "Introduces a more luxurious modern classic feel.",
  "Aged brass": "Warm metallic detail that lifts a neutral scheme.",
  "Blackened steel":
    "A crisp graphic line that sharpens softer materials around it.",
  "Woven rugs": "Layered texture that defines the area underfoot.",
  "Ceramic accessories":
    "Small handmade forms that break up hard, flat surfaces.",
  Glass: "Keeps sightlines open where floor space is tight.",
  Stone: "Weight and permanence, and a surface that changes with the light.",
  "Natural stone":
    "Weight and permanence, and a surface that changes with the light.",
  "Dried grasses": "Height and movement without the upkeep of cut flowers.",
  "Woven textures": "Handmade irregularity against machine-made precision.",
  Cotton: "Light, washable and easy to change with the season.",
  Teak: "Silvers down to a soft grey outdoors and needs almost nothing doing to it.",
  Slate: "Dark, matte and unbothered by rain.",
  Gravel: "Loose texture underfoot, and it drains where paving does not.",
  "Porcelain paving":
    "Flat, consistent and easy to keep clean under a seating area.",
  "Corten steel": "Weathers to a deep rust tone that warms up a grey scheme.",
  "Outdoor rope and weave": "Softens hard landscaping without holding water.",
  Terracotta: "Warm and traditional, and it ages rather than degrades.",
  "Architectural grasses":
    "Height and movement through winter, when little else offers either.",
  "Climbing planting":
    "Softens a frame over a season or two without hiding it.",
  Brick: "Familiar, warm-toned and a natural match for older houses.",
};

type Zone = "indoor" | "outdoor";

/**
 * How the product meets the building.
 *
 * A wall clock has no footprint, cannot be "set out from the wall", and does
 * not sit below eye level. Describing one with floor-standing furniture logic
 * — clearance, circulation, doorway widths — is the same fault as telling a
 * pergola about the room, and the first catalogue-wide run produced exactly
 * that on every clock, mirror and framed piece we sell.
 */
type Placement = "floor" | "wall" | "surface";

/**
 * How big the thing actually is.
 *
 * Damien, on a 15cm planter headed "Built Around Its Measurements": "your way
 * too focused on measurements, this is a small planter. absolutely no need for
 * a title like that. no one cares about the measurements of a small planter."
 *
 * He is right, and the fault is the same one as the pergola being told about
 * the room: furniture reasoning applied to something that is not furniture. A
 * 15cm pot does not "anchor the space it sits in" and nobody measures their
 * shelf before buying one. Scale decides how much of the page is about size,
 * and for a small object the answer is almost none of it.
 */
export type Scale = "small" | "medium" | "large";

export function scaleOf(
  dimensions:
    { length?: number; width?: number; height?: number } | null | undefined,
): Scale {
  const largest = Math.max(
    ...[dimensions?.length, dimensions?.width, dimensions?.height].map((n) =>
      typeof n === "number" && n > 0 ? n : 0,
    ),
  );
  if (largest <= 0) return "medium";
  if (largest < 45) return "small";
  if (largest < 110) return "medium";
  return "large";
}

const PLACEMENT_BY_FAMILY: Record<Family, Placement> = {
  outdoor: "floor",
  furniture: "floor",
  wellness: "floor",
  wall: "wall",
  vessel: "surface",
  candle: "surface",
  lighting: "surface",
};

/** Smaller spaces the piece particularly suits — the Sorelle's "Ideal for Apartments". */
const COMPACT_SPACES: Record<Zone, string[]> = {
  indoor: [
    "City apartments",
    "Modern flats",
    "Open-plan apartments",
    "Luxury rental properties",
    "Serviced apartments",
    "Guest accommodation",
    "Period conversions",
    "New-build homes",
  ],
  outdoor: [
    "Courtyard gardens",
    "Small city gardens",
    "Roof terraces",
    "Balcony spaces",
    "Rear patios",
    "Side returns",
    "Holiday-let gardens",
    "New-build plots",
  ],
};

/** Making a defined zone out of it — the Sorelle's "Create a Relaxed Reading Area". */
const ZONE: Record<
  Family,
  {
    heading: string;
    lead: string;
    intro: string;
    items: string[];
    close: string;
  }
> = {
  outdoor: {
    heading: "Create a Defined Outdoor Room",
    lead: "One of the most useful things it does is turn an open stretch of paving into somewhere that feels like a room.",
    intro: "Build the zone with:",
    items: [
      "Outdoor seating or a dining set",
      "An outdoor rug",
      "Weatherproof cushions and throws",
      "Planters marking the edges",
      "Festoon or solar lighting overhead",
      "A side table for drinks",
      "Screening or trellis on the exposed side",
    ],
    close:
      "Edges are what make a zone read as deliberate. Marking them with planting or a rug does more than adding furniture in the middle.",
  },
  furniture: {
    heading: "Create a Relaxed Reading Area",
    lead: "It can be used to make a dedicated reading or relaxation corner rather than simply adding another seat.",
    intro: "Pair it with:",
    items: [
      "A floor lamp",
      "A side table",
      "A soft throw",
      "Cushions",
      "Books within reach",
      "A natural rug",
      "A small decorative table",
    ],
    close:
      "The point of a corner like this is that everything you need is within arm's length, so nothing interrupts once you have sat down.",
  },
  vessel: {
    heading: "Build a Considered Display",
    lead: "A single vessel on an empty surface rarely holds attention. Grouped, it becomes an arrangement.",
    intro: "Group it with:",
    items: [
      "Two smaller vessels at differing heights",
      "A stack of books as a plinth",
      "A tray to gather the group",
      "A candle or holder",
      "Foliage or dried stems",
      "Framed artwork behind",
    ],
    close:
      "Odd numbers and differing heights read as considered; matched pairs at the same height read as a shop display.",
  },
  candle: {
    heading: "Create an Evening Atmosphere",
    lead: "Candlelight works by contrast, so what matters as much as the holder is what else is lit around it.",
    intro: "Set it out with:",
    items: [
      "Larger and smaller holders in a group",
      "A tray to gather them on",
      "Foliage or dried stems",
      "Table linen",
      "A mirror behind, to double the light",
      "Dimmed overhead lighting",
    ],
    close:
      "Turning the main light down rather than off is what makes a grouping read as warm instead of theatrical.",
  },
  lighting: {
    heading: "Layer the Light in the Room",
    lead: "A room lit only from the ceiling looks flat at every hour. Lamps at different heights are what give it depth.",
    intro: "Layer it with:",
    items: [
      "A ceiling light on a dimmer",
      "A second lamp across the room",
      "A candle or two at low level",
      "A side table to stand it on",
      "A pale wall nearby to bounce light off",
    ],
    close:
      "Three light sources at three different heights is the usual rule, and it holds in almost every room.",
  },
  wall: {
    heading: "Build the Wall Around It",
    lead: "What goes beneath a wall piece decides whether it looks placed or simply hung.",
    intro: "Arrange it with:",
    items: [
      "A console table or sideboard beneath",
      "A pair of table lamps",
      "A vase or bowl",
      "Smaller frames grouped to one side",
      "A bench or slim seat",
    ],
    close:
      "Roughly two-thirds the width of the furniture beneath is the proportion that usually looks right.",
  },
  wellness: {
    heading: "Set Up the Routine Around It",
    lead: "What surrounds it decides whether it gets used twice a week or twice a year.",
    intro: "Set it up with:",
    items: [
      "Towel storage within reach",
      "A bench or stool",
      "Robe hooks",
      "Slip-resistant matting",
      "A timer or clock",
      "Soft, low lighting",
    ],
    close:
      "Anything that adds a step before you start is the thing that quietly ends the habit, so keep the setup short.",
  },
};

/** The three scheme sections the Sorelle runs back to back. */
const SCHEMES: {
  heading: Record<Zone, string>;
  lead: string;
  intro: string;
  items: Record<Zone, string[]>;
  close: string;
}[] = [
  {
    heading: {
      indoor: "Contemporary Interior Styling",
      outdoor: "Contemporary Garden Styling",
    },
    lead: "It can form the foundation of a contemporary scheme built on clean lines, a restrained palette and carefully chosen texture.",
    intro: "Pair it with:",
    items: {
      indoor: [
        "A sculptural coffee table",
        "Contemporary artwork",
        "Minimalist lighting",
        "Neutral rugs",
        "Ceramic accessories",
        "Indoor plants",
        "Natural timber",
      ],
      outdoor: [
        "Porcelain or large-format paving",
        "Corten steel planters",
        "Architectural grasses",
        "Recessed or linear lighting",
        "Slatted screening",
        "A restrained two-tone palette",
        "Clipped evergreen structure",
      ],
    },
    close:
      "Keep the surrounding palette restrained and let proportion and material do the work rather than colour.",
  },
  {
    heading: {
      indoor: "Modern Classic Styling",
      outdoor: "Modern Classic Garden Styling",
    },
    lead: "It also moves comfortably into more traditional schemes, where the cleaner silhouette becomes the contemporary note rather than the whole story.",
    intro: "Combine it with:",
    items: {
      indoor: [
        "Marble",
        "Brass",
        "Dark timber",
        "Framed artwork",
        "Decorative mirrors",
        "Soft lighting",
        "Velvet",
        "Neutral curtains",
      ],
      outdoor: [
        "York or sandstone paving",
        "Aged brass or copper lanterns",
        "Box and yew structure",
        "Terracotta or lead planters",
        "Gravel paths",
        "Climbing roses or wisteria",
        "Traditional brick edging",
      ],
    },
    close:
      "A single clean-lined piece within a decorative scheme reads as deliberate. Several start to look like two schemes competing.",
  },
  {
    heading: {
      indoor: "Coastal and Organic Interiors",
      outdoor: "Coastal and Organic Gardens",
    },
    lead: "The same piece suits a softer, looser direction, where texture matters more than symmetry.",
    intro: "Style it with:",
    items: {
      indoor: [
        "Linen",
        "Rattan",
        "Pale timber",
        "Woven rugs",
        "Natural ceramics",
        "Soft beige",
        "Warm white",
        "Indoor greenery",
      ],
      outdoor: [
        "Bleached or pale timber",
        "Gravel and shingle",
        "Grasses and drought-tolerant planting",
        "Woven and rope textures",
        "Soft off-whites",
        "Weathered finishes",
        "Pots grouped in odd numbers",
      ],
    },
    close:
      "The result is relaxed without being untidy, which is a harder balance than it sounds and comes down to editing.",
  },
];

/** Trade and professional buyers — the Sorelle's designer and hospitality section. */
const TRADE: Record<Zone, string[]> = {
  indoor: [
    "Interior designers",
    "Architects",
    "Property developers",
    "Boutique hotels",
    "Serviced apartments",
    "Show homes",
    "Premium rental properties",
    "Hospitality projects",
    "Residential developments",
    "Guest accommodation",
    "Reception areas",
    "Lounge spaces",
    "Executive interiors",
  ],
  outdoor: [
    "Landscape designers",
    "Garden designers",
    "Architects",
    "Property developers",
    "Boutique hotels",
    "Holiday lets",
    "Restaurant and pub terraces",
    "Show homes and show gardens",
    "Premium rental properties",
    "Residential developments",
    "Guest accommodation",
    "Wedding and event venues",
  ],
};

/** Building a coordinated set around it. */
const ROOM_SET: Record<Zone, string[]> = {
  indoor: [
    "A coffee table",
    "Matching side tables",
    "Floor lamps",
    "Table lamps",
    "Decorative cushions",
    "Textured rugs",
    "Mirrors",
    "Artwork",
    "Ceramic accessories",
    "Indoor plants",
  ],
  outdoor: [
    "Outdoor seating",
    "A dining table and chairs",
    "An outdoor rug",
    "Weatherproof cushions",
    "Planters and specimen trees",
    "Festoon lighting",
    "A fire pit or patio heater",
    "Side tables",
    "Screening or trellis",
    "A storage box for cushions",
  ],
};

/** Shapes that contrast with it, for the closing section. */
const CONTRASTS: Record<Zone, string[]> = {
  indoor: [
    "Rectangular coffee tables",
    "Angular shelving",
    "Linear consoles",
    "Sculptural lighting",
    "Curved occasional furniture",
    "Round mirrors",
  ],
  outdoor: [
    "Rectangular paving",
    "Linear raised beds",
    "Rounded planters",
    "Sculptural specimen planting",
    "Curved seating",
    "Straight-run screening",
  ],
};

/** Other jobs the same piece can do. */
const ALTERNATIVE_USES: Record<Family, string[]> = {
  outdoor: [
    "A covered dining area",
    "A shaded seating area",
    "A hot tub or spa surround",
    "A garden bar or serving area",
    "An outdoor kitchen cover",
    "A sheltered walkway",
    "A defined edge to a lawn",
  ],
  furniture: [
    "Main living room seating",
    "Apartment seating",
    "Guest room seating",
    "Bedroom seating",
    "A reading corner",
    "Home office seating",
    "A reception or waiting area",
  ],
  vessel: [
    "A dining table centrepiece",
    "A hallway console piece",
    "A mantelpiece object",
    "A bedside arrangement",
    "A desk or reception piece",
    "A gift",
  ],
  candle: [
    "Everyday evening lighting",
    "Table settings for dinner",
    "Bathroom atmosphere",
    "Seasonal and Christmas displays",
    "Event and wedding styling",
    "A gift",
  ],
  lighting: [
    "A reading light",
    "An ambient corner light",
    "A hallway light",
    "A bedside light",
    "A desk or task light",
    "A gift",
  ],
  wall: [
    "A living room focal wall",
    "A hallway piece",
    "A stairwell arrangement",
    "A bedroom piece",
    "A cloakroom or utility piece",
    "A gift",
  ],
  wellness: [
    "Post-training recovery",
    "Contrast therapy",
    "An evening wind-down routine",
    "A weekend routine",
    "Guest and holiday-let use",
    "Treatment room use",
  ],
};

function pairingsFor(
  material: string | null,
  colour: string | null,
  outdoors: boolean,
) {
  const m = (material ?? "").toLowerCase();
  const FAMILIES: Record<string, string[]> = {
    metal: [
      "steel",
      "iron",
      "aluminium",
      "aluminum",
      "brass",
      "chrome",
      "nickel",
      "zinc",
    ],
    wood: [
      "teak",
      "oak",
      "acacia",
      "mango",
      "elm",
      "pine",
      "timber",
      "rubberwood",
      "mdf",
    ],
    ceramic: ["porcelain", "stoneware", "earthenware", "clay"],
    stone: ["marble", "granite", "slate", "concrete"],
    fabric: [
      "linen",
      "cotton",
      "velvet",
      "bouclé",
      "boucle",
      "polyester",
      "upholstery",
    ],
    rattan: ["wicker", "bamboo", "seagrass", "jute"],
    glass: ["mirror", "mirrored", "crystal"],
  };
  const table = outdoors ? OUTDOOR_PAIRINGS : MATERIAL_PAIRINGS;
  const materialKey =
    Object.keys(table).find((key) => m.includes(key)) ??
    Object.keys(FAMILIES).find((key) =>
      FAMILIES[key]!.some((word) => m.includes(word)),
    );
  const c = (colour ?? "").toLowerCase();
  const colourKey = Object.keys(COLOUR_PAIRINGS).find((key) => c.includes(key));
  return {
    materials: materialKey ? (table[materialKey] ?? null) : null,
    colours: colourKey ? COLOUR_PAIRINGS[colourKey]! : null,
  };
}

export function describeLong(input: LongFormInput): LongSection[] {
  const name = displayName(input.title);
  const family = familyFor(input.category);
  const d = input.dimensions;
  const unit = d?.unit ?? "cm";
  const width = has(d?.width) ? d!.width! : has(d?.length) ? d!.length! : null;
  const height = has(d?.height) ? d!.height! : null;
  const length = has(d?.length) ? d!.length! : null;
  const material =
    input.materialDisputed || !input.material
      ? null
      : dominantMaterial(input.material.toLowerCase());
  const rawColour = input.colour?.toLowerCase() ?? null;
  const colour = rawColour ? formatColour(rawColour) : null;
  const sections: LongSection[] = [];
  const short = shortName(name);
  // A pergola does not sit in a "room".
  // Siting, not family, decides whether this thing stands in the rain. An
  // outdoor sauna writes like wellness copy — that is its family — but it is
  // in a garden, and the first version told its buyer about sightlines across
  // the room. Family is only the fallback, for categories siting does not
  // recognise.
  const siting = sitingFor(input.category);
  const zone: Zone =
    siting === "outdoor"
      ? "outdoor"
      : siting === "indoor"
        ? "indoor"
        : family === "outdoor"
          ? "outdoor"
          : "indoor";
  const place = zone === "outdoor" ? "garden" : "room";
  const placeThe = zone === "outdoor" ? "the garden" : "the room";
  const { materials, colours } = pairingsFor(
    material,
    colour,
    zone === "outdoor",
  );
  const scheme =
    zone === "outdoor" ? "a layered planting scheme" : "a layered interior";
  const placement = PLACEMENT_BY_FAMILY[family];
  const scale = scaleOf(input.dimensions);
  /** What the product actually takes up space on. */
  const surfaceWord =
    placement === "wall" ? "wall" : placement === "surface" ? "surface" : place;

  // 1. Opening — design, proportion, the headline measurement.
  const opening: string[] = [];
  opening.push(
    `${withThe(name, true)} brings together ${material ? `${material} construction, ` : ""}considered proportions and a restrained design. The result works as comfortably in a relaxed everyday setting as in a carefully styled one.`,
  );
  if (scale === "small") {
    // One line, stated plainly and then dropped. A small object is bought on
    // how it looks and what it holds, not on whether it will fit.
    if (width && height)
      opening.push(
        `It is a small piece — ${width}${unit} across and ${height}${unit} tall — meant to be grouped, moved around and lived with rather than planned around.`,
      );
  } else if (width && height)
    opening.push(
      width === height
        ? `At ${width}${unit} across it has real presence without demanding the space of something larger. That balance is what makes it adaptable. Substantial enough to hold its own, contained enough not to crowd what surrounds it.`
        : `Its ${width}${unit} span and ${height}${unit} height give it real presence without demanding the ${placement === "floor" ? "footprint" : "space"} of something larger. That balance is what makes it adaptable. Substantial enough to anchor the space it sits in, contained enough not to crowd it.`,
    );
  else if (height)
    opening.push(
      `At ${height}${unit} it has enough height to register in a ${place} without dominating it, which is what keeps a piece like this useful across very different spaces.`,
    );
  if (scale !== "small" && length && width && length !== width)
    opening.push(
      placement === "floor"
        ? `The ${length} × ${width}${unit} footprint is the figure to measure against your space before ordering. Allow clearance around it rather than filling the space ${zone === "outdoor" ? "boundary to boundary" : "wall to wall"}. That is what keeps a ${place} feeling generous.`
        : placement === "wall"
          ? `Measure the wall rather than the ${place}. A clear run of ${width}${unit} is what it needs, and the gap between a door architrave and the end of a shelf is what usually decides the answer.`
          : `It needs ${width}${unit} of clear surface. Measure the sideboard, shelf or table it is going on rather than the ${place}, and leave space around it so it reads as placed rather than wedged in.`,
    );
  // "Built Around Its Measurements" over a paragraph containing no measurement
  // is the page telling the reader something it has not done. The heading has
  // to follow what the section actually says.
  const openingStatesSize = opening.length > 1 && scale !== "small";
  sections.push({
    heading: pick(
      openingStatesSize
        ? [
            "Considered Proportions, Quiet Design",
            "Design and Proportion",
            "Built Around Its Measurements",
          ]
        : ["Considered, Quiet Design", "The Design", "What It Is"],
      input.slug,
      1,
    ),
    paragraphs: opening,
  });

  // 2. Where it belongs — the long settings list.
  // A wellness product's settings list holds both "Poolside areas" and "Spa
  // rooms". Which of those is wrong depends entirely on where the product
  // stands, so the list is filtered rather than written twice.
  const OUTDOOR_ONLY_SETTINGS =
    /^(?:poolside|garden|patio|terrace|decking|balcon|roof terrace|courtyard|outdoor|show garden|landscap|allotment|barbecue|hot tub)/i;
  const INDOOR_ONLY_SETTINGS =
    /^(?:spa room|treatment room|home gym|recovery studio|living room|bedroom|hallway|landing|cloakroom|stairwell|mantelpiece|windowsill|conservator)/i;
  const settings = SETTINGS[family].filter((setting) =>
    zone === "outdoor"
      ? !INDOOR_ONLY_SETTINGS.test(setting)
      : !OUTDOOR_ONLY_SETTINGS.test(setting),
  );

  sections.push({
    heading: pick(
      family === "outdoor"
        ? [
            "Designed for Outdoor Living",
            "Made for the Garden",
            "Built for Outside",
          ]
        : [
            "Designed for Contemporary Living",
            "Where It Belongs",
            "Suited to Modern Interiors",
          ],
      input.slug,
      2,
    ),
    paragraphs: [
      `${withThe(short, true)} has been chosen to suit a wide range of residential and professional settings rather than one narrow use.`,
    ],
    list: { intro: "Perfect for:", items: settings },
  });

  // 3. Material, and what sits beside it.
  if (material && materials) {
    sections.push({
      heading: pick(
        [
          `${title(material)} Construction`,
          "Materials and Character",
          "The Material It Is Made From",
        ],
        input.slug,
        3,
      ),
      paragraphs: [
        `The ${material} construction is central to how ${withThe(short, false)} reads in ${placeThe}. It carries its own texture and weight. That is what lets a piece sit within ${scheme} rather than appearing visually isolated.`,
        `Materials of this kind work best when they are answered elsewhere in the scheme rather than left to stand alone.`,
      ],
      list: { intro: `Pair ${withThe(short, false)} with:`, items: materials },
    });
  }

  // 4. Colour, and what sits beside it.
  if (colour && colours) {
    sections.push({
      heading: pick(
        [
          `${articleFor(colour, true)} ${title(colour)} Finish`,
          "Colour and Palette",
          "Working With the Finish",
        ],
        input.slug,
        4,
      ),
      paragraphs: [
        `The ${colour} finish gives ${withThe(short, false)} a versatile foundation. The rest of ${placeThe} can then be styled around it rather than against it.`,
        `It also makes seasonal changes straightforward. The same piece can be refreshed with different textiles and accessories without anything looking forced.`,
      ],
      list: { intro: "Pair it with:", items: colours },
    });
  }

  // 5. Five styling directions.
  sections.push({
    heading: pick(
      ["Five Ways to Style It", "Styling Directions", "Ways to Take It"],
      input.slug,
      5,
    ),
    paragraphs: [
      `${withThe(short, true)} adapts to several different directions depending on what surrounds it. Each of these keeps the piece itself unchanged and shifts everything around it.`,
      ...(zone === "outdoor" ? OUTDOOR_STYLING : STYLING_DIRECTIONS).map(
        (s) => `${s.name} — ${s.how}`,
      ),
    ],
  });

  // 5b. What to put beside it — the Sorelle's "Position it alongside:".
  const COMPANIONS: Record<Family, string[]> = {
    outdoor: [
      "Outdoor seating",
      "A dining table and chairs",
      "Outdoor rugs",
      "Weatherproof cushions",
      "Planters and specimen trees",
      "Solar or festoon lighting",
      "A fire pit or patio heater",
      "Side tables",
      "Screening or trellis",
    ],
    furniture: [
      "A coffee table",
      "Floor lamp",
      "Side tables",
      "Decorative cushions",
      "A textured rug",
      "Large artwork",
      "Indoor greenery",
      "A console table",
    ],
    vessel: [
      "Table lamps",
      "Stacked books",
      "A tray or bowl",
      "Candle holders",
      "Smaller vessels in a group",
      "Framed artwork behind",
      "A textured runner",
    ],
    candle: [
      "Larger and smaller holders in a group",
      "A tray to gather them on",
      "Foliage or dried stems",
      "Table linen",
      "A mirror behind, to double the light",
    ],
    lighting: [
      "A side table or console",
      "Stacked books",
      "A small plant",
      "Framed artwork",
      "A tray for keys or glasses",
    ],
    wall: [
      "A console table beneath",
      "Table lamps",
      "A vase or bowl",
      "Smaller frames in a group",
      "A bench or slim seat",
    ],
    wellness: [
      "Towel storage",
      "A bench or stool",
      "Robe hooks",
      "Slip-resistant matting",
      "Cold water storage",
      "Soft lighting",
    ],
  };
  sections.push({
    heading: pick(
      zone === "outdoor"
        ? [
            "Building the Space Around It",
            "What to Put Beside It",
            "Completing the Setting",
          ]
        : [
            "Perfect for Living Rooms",
            "What to Put Beside It",
            "Building the Scheme",
          ],
      input.slug,
      8,
    ),
    paragraphs: [
      `${withThe(short, true)} rarely stands alone. What surrounds it decides whether it reads as a considered choice or an isolated object. The pieces below are the ones that most often do that work.`,
      ...(width && scale !== "small"
        ? [
            `Scale everything around it to the same ${width}${unit} span. A piece that is noticeably shorter or taller than what it sits beside is what makes an arrangement look assembled rather than chosen.`,
          ]
        : []),
    ],
    list: { intro: "Position it alongside:", items: COMPANIONS[family] },
  });

  // 5c. What it is actually for.
  const USES: Record<Family, string[]> = {
    outdoor: [
      "Outdoor dining",
      "Shade through the middle of the day",
      "Shelter from light rain",
      "Entertaining",
      "Quiet mornings outside",
      "Extending the season into spring and autumn",
      "Defining a seating area within a larger garden",
    ],
    furniture: [
      "Everyday relaxation",
      "Reading",
      "Watching television",
      "Socialising",
      "Entertaining guests",
      "Quiet evenings",
      "Working from home",
    ],
    vessel: [
      "Cut flowers",
      "Dried stems and grasses",
      "Foliage from the garden",
      "A single sculptural branch",
      "Standing empty as an object in its own right",
    ],
    candle: [
      "Evening light in a living room",
      "Table settings for dinner",
      "Bathroom atmosphere",
      "Seasonal displays",
      "Grouped arrangements at differing heights",
    ],
    lighting: [
      "Reading light beside a chair",
      "Ambient light in a corner",
      "Layering with overhead lighting",
      "Evening light in a hallway",
      "Task light on a desk",
    ],
    wall: [
      "Filling a bare wall",
      "Reflecting light into a darker room",
      "Marking a hallway or landing",
      "Anchoring a console or sideboard",
    ],
    wellness: [
      "Post-training recovery",
      "Contrast therapy",
      "Winding down in the evening",
      "Weekend routine",
      "Guest and holiday-let use",
    ],
  };
  sections.push({
    heading: pick(
      ["What You Will Use It For", "In Everyday Use", "How It Earns Its Place"],
      input.slug,
      9,
    ),
    paragraphs: [
      `A piece is only worth its space if it is used, and ${withThe(short, false)} suits several patterns of use rather than one.`,
      // A wall piece is screwed to the wall; telling the reader it "stays
      // where you put it" is describing something else entirely.
      // The practical section already states the weight, and on a small object
      // that is the only place it belongs. Saying it twice produced "it stays
      // where you put it" beside "light enough to move around".
      ...(has(input.weight?.value) && placement !== "wall" && scale !== "small"
        ? [
            `At ${input.weight!.value}${input.weight!.unit ?? "kg"} it stays where you put it in ordinary use, which matters more for some of these than others.`,
          ]
        : []),
    ],
    list: { intro: "Use it for:", items: USES[family] },
  });

  // 5d. Scale and presence — the Sorelle's closing argument.
  // "Presence without dominance" and "getting the scale right" are questions
  // you ask about a sofa, not about a 15cm pot. On a small object the whole
  // section is invented importance, so it does not run.
  if (scale !== "small" && (width || height)) {
    const presence: string[] = [
      `${withThe(short, true)} has enough presence to hold ${placeThe} without becoming the only thing in it. That balance matters more than size alone. A piece that dominates makes a space feel smaller. One that disappears was not worth buying.`,
    ];
    // The Sorelle states its 197 cm width in section after section, and that
    // repetition is not padding — it is the number the reader is deciding on,
    // put where the decision is being made. So the figures go in whatever
    // their magnitude, with only the reading of them changing.
    if (height)
      presence.push(
        height >= 200
          ? `At ${height}${unit} it works with height rather than against it, drawing the eye up. ${zone === "outdoor" ? "Under a first-floor window or a deep overhang it will feel compressed, so give it air above." : "Under a low ceiling it will feel compressed, so give it air above."}`
          : placement === "wall"
            ? `At ${height}${unit} tall it wants hanging with its centre near eye level. About 145cm from the floor is the gallery convention, and it is the right answer far more often than hanging it to match the furniture.`
            : placement === "surface"
              ? `At ${height}${unit} tall it reads at seated eye level on a table, which is where an object of this kind does its work.`
              : `At ${height}${unit} it sits below eye level, which keeps sightlines across the ${place} open. That is what stops a piece of this footprint closing the space in.`,
      );
    if (width)
      presence.push(
        width >= 200
          ? `Its ${width}${unit} span reads as generous. Set against a boundary or a wall it defines an area. Set centrally it divides one. That is a different job, and worth deciding before you build around it.`
          : placement === "wall"
            ? `Its ${width}${unit} width decides how much wall it needs. Leave more clear space around it than feels necessary — crowding a wall piece is the most reliable way to make it look smaller than it is.`
            : placement === "surface"
              ? `Its ${width}${unit} width is substantial without being the largest option available. Given a surface to itself it reads as a single object; set among others it becomes part of a group, which is a different job and worth deciding first.`
              : `Its ${width}${unit} span is substantial without being the largest option available. Set against a wall it defines an area. Set out from one it divides the ${place}, which is a different job and worth deciding first.`,
      );
    presence.push(
      `Contrast is what keeps that balance interesting. A ${place} in which every line runs the same way reads as flat. The quickest correction is to answer one shape with another.`,
    );
    sections.push({
      heading: pick(
        [
          "Presence Without Dominance",
          "Getting the Scale Right",
          "How It Sits in the Space",
        ],
        input.slug,
        10,
      ),
      paragraphs: presence,
      list: {
        intro: "Particularly effective alongside:",
        items: CONTRASTS[zone],
      },
    });
  }

  // 5e. Smaller spaces — the Sorelle's "Ideal for Apartments". A 15cm pot fits
  // everywhere, so asking whether it will is a question nobody has.
  if (scale !== "small")
    sections.push({
      optional: true,
      heading:
        zone === "outdoor"
          ? "Suited to Smaller Gardens"
          : "Suited to Smaller Spaces",
      paragraphs: [
        width
          ? placement === "floor"
            ? `Not every ${place} has space to spare. A ${width}${unit} footprint is a figure worth holding against a tape measure before anything else. Where it fits, it fits properly rather than only just.`
            : `Not every ${surfaceWord} has a clear run to spare. ${width}${unit} across is the figure to hold against the ${surfaceWord} you have in mind, before anything else about it matters.`
          : `Not every ${place} has space to spare, which is where a piece of contained proportions earns its place over something larger.`,
        `A smaller ${place} is not a reason to settle for a smaller version of what you wanted. What matters is that the piece is scaled to the ${surfaceWord} it is going on. Measure that rather than estimating it.`,
      ],
      list: {
        intro: "It works particularly well within:",
        items: COMPACT_SPACES[zone],
      },
    });

  // 5f. Making a defined zone of it.
  const zoneCopy = ZONE[family];
  sections.push({
    heading: zoneCopy.heading,
    paragraphs: [zoneCopy.lead],
    list: { intro: zoneCopy.intro, items: zoneCopy.items },
    close: zoneCopy.close,
  });

  // 5g. Named material pairings, each with a reason — the Sorelle's
  //     "Natural Material Pairings" section.
  if (materials) {
    const noted = materials
      .filter((m) => PAIRING_NOTES[m])
      .slice(0, 6)
      .map((m) => `${m} — ${PAIRING_NOTES[m]!}`);
    if (noted.length >= 4) {
      sections.push({
        heading: "Natural Material Pairings",
        paragraphs: [
          `Some combinations do more work than others. These are the ones worth reaching for first, and why each of them works.`,
          ...noted,
        ],
      });
    }
  }

  // 5h. Three complete scheme directions.
  for (const direction of SCHEMES) {
    sections.push({
      optional: true,
      heading: direction.heading[zone],
      paragraphs: [direction.lead],
      list: { intro: direction.intro, items: direction.items[zone] },
      close: direction.close,
    });
  }

  // 5i. Trade and professional buyers.
  sections.push({
    optional: true,
    heading:
      zone === "outdoor"
        ? "For Garden Designers and Hospitality Projects"
        : "For Interior Designers and Hospitality Projects",
    paragraphs: [
      `${withThe(short, true)} suits professional specification as readily as a single private order. That usually comes down to one question: whether a piece can be repeated across a scheme without looking repeated.`,
    ],
    list: { intro: "Specified by:", items: TRADE[zone] },
  });

  // 5j. Building the complete set.
  sections.push({
    optional: true,
    heading:
      zone === "outdoor"
        ? "Create a Complete Outdoor Scheme"
        : "Create a Complete Room Set",
    paragraphs: [
      `It works well as the centrepiece of a coordinated arrangement rather than as a single purchase. The pieces below are what most often complete one.`,
    ],
    list: { intro: "Build around it with:", items: ROOM_SET[zone] },
    close: `Because the piece itself is restrained, you can change everything around it later without replacing the thing you spent the most on.`,
  });

  // 5k. Other jobs it can do.
  sections.push({
    optional: true,
    heading: pick(
      ["More Than One Job", "A Versatile Piece", "Other Ways to Use It"],
      input.slug,
      11,
    ),
    paragraphs: [
      `It is more adaptable than a single obvious use suggests, which matters if your plans for the space are likely to change.`,
    ],
    list: { intro: "Use it as:", items: ALTERNATIVE_USES[family] },
  });

  // 6. What the product actually records — the part the Sorelle page does
  //    with "197 cm width" woven through, and the part that has to be true.
  const practical: string[] = [];
  const extra = input.extra ?? {};
  const rawAssembly = extra["Assembly Required"];
  const rawOutdoorUse = extra["Indoor Outdoor Use"];
  const assembly =
    rawAssembly && usableFact(rawAssembly) ? rawAssembly : undefined;
  const outdoorUse =
    rawOutdoorUse && usableFact(rawOutdoorUse) ? rawOutdoorUse : undefined;
  const weight = input.weight?.value;
  const wUnit = input.weight?.unit ?? "kg";

  if (assembly)
    practical.push(
      /^no\b/i.test(assembly)
        ? `${withThe(short, true)} arrives assembled and ready to use, with nothing to build on arrival.`
        : `Assembly is required. The fixings and instructions are supplied, and a piece of this size is far easier with two people than one.`,
    );
  if (has(weight))
    practical.push(
      placement === "wall"
        ? weight >= 5
          ? `At ${weight}${wUnit} it needs a fixing matched to the wall it is going on. Masonry is straightforward; plasterboard needs a proper hollow-wall anchor rather than the plug that comes in the box, and finding a stud is better than either.`
          : `At ${weight}${wUnit} it hangs from a single well-chosen fixing. On plasterboard that still means an anchor rather than a bare screw.`
        : placement === "surface"
          ? weight >= 5
            ? `At ${weight}${wUnit} it has enough weight to stay put once placed, which is worth knowing if the surface it is going on is a narrow shelf.`
            : `At ${weight}${wUnit} it is light enough to move around while you decide where it looks best.`
          : weight >= 25
            ? `At ${weight}${wUnit} this is a two-person lift. Worth arranging help for the day it arrives. Check the route in beforehand too — ${zone === "outdoor" ? "side gates, alleyways and any steps down to the garden" : "doorways, turns and stair widths"}.`
            : `At ${weight}${wUnit} one person can manage it comfortably. That makes repositioning it later a decision rather than an undertaking.`,
    );
  if (outdoorUse)
    practical.push(
      /indoor only/i.test(outdoorUse)
        ? `Despite how it looks, this is an indoor piece and should not be left out in the weather.`
        : /fair weather/i.test(outdoorUse)
          ? `It suits sheltered outdoor use in fair weather. Bringing it in or covering it over winter will add years to it.`
          : usableFact(outdoorUse)
            ? outdoorUse
            : "",
    );
  if (width && scale !== "small")
    practical.push(
      family === "outdoor"
        ? `Measure the ${width}${unit} footprint against your paving or decking. Leave clearance rather than setting it flush to a wall. Anything sitting hard against a fence stays damp on that side long after the rest has dried.`
        : placement === "wall"
          ? `Measure the ${width}${unit} width against the wall before ordering, and check what is behind the plaster before you drill. Pipework and cabling run where you would least like to find them.`
          : placement === "surface"
            ? `Measure the ${width}${unit} width against the surface it is going on. A piece that overhangs the edge of a shelf looks like a mistake however good it is.`
            : `Measure the ${width}${unit} width against the wall or alcove it is going into before ordering, and measure the doorways it has to come through as well. The second measurement is the one people forget.`,
    );
  const warning = extra["Product Warning"];
  if (warning && usableFact(warning))
    practical.push(warning.replace(/\.?$/, "."));

  if (practical.length) {
    sections.push({
      heading: pick(
        ["Before You Order", "Practical Detail", "What to Know First"],
        input.slug,
        6,
      ),
      paragraphs: practical,
    });
  }

  // 7. Features the supplier states, if any.
  const features = (input.features ?? []).filter(
    (f) => f && f.length > 2 && usableFact(f),
  );
  if (features.length >= 2) {
    sections.push({
      heading: pick(
        ["At a Glance", "Specification", "The Particulars"],
        input.slug,
        7,
      ),
      paragraphs: [`Recorded against ${withThe(short, false)}:`],
      list: { intro: "", items: features },
    });
  }

  if (input.deliveryLeadTime) {
    sections.push({
      heading: "Delivery",
      paragraphs: [
        `Dispatched within ${input.deliveryLeadTime.trim()}, with free UK delivery on every order.`,
      ],
    });
  }

  return trimToSubstance(sections);
}

/** Every word of a section, headings and list items included. */
function sectionText(s: LongSection): string {
  return [
    s.heading,
    ...s.paragraphs,
    ...(s.list ? [s.list.intro, ...s.list.items] : []),
    ...(s.close ? [s.close] : []),
  ].join(" ");
}

/**
 * Drops styling sections until the page's length is earned by its facts.
 *
 * The quality scorer calls a description longer than 900 words carrying fewer
 * than 0.5 facts per 100 words "length standing in for substance", and it is
 * right to. Rather than guess in advance how long a product has earned from
 * how many fields it has filled in — which got it backwards, gating on colour
 * while a pergola with four measurements lost its styling sections — this
 * builds the whole page, measures what it actually says, and removes the
 * optional sections from the back until the remainder clears the bar.
 *
 * A product with real measurements keeps the full Sorelle-length page. A
 * product we hold almost nothing on gets a shorter, honest one, and shows up
 * in the audit as needing its facts harvested. That is the real fix, and this
 * stops us papering over it with styling lists in the meantime.
 */
export function trimToSubstance(sections: LongSection[]): LongSection[] {
  const kept = [...sections];
  const measure = () => {
    const body = kept.map(sectionText).join(" ");
    const words = body.split(/\s+/).filter(Boolean).length;
    const facts = (body.match(FACT_PATTERN) ?? []).length;
    return { words, per100: words > 0 ? (100 * facts) / words : 0 };
  };
  // Comfortably inside the scorer's limits, so a page that survives the trim
  // is not sitting one word away from being flagged. The word floor is below
  // the scorer's 900 because the scorer weighs the summary in with the
  // description, and the summary is not ours to fix from here.
  for (let guard = 0; guard < 32; guard++) {
    const { words, per100 } = measure();
    if (words <= 750 || per100 >= 0.6) break;
    const last = kept.map((s) => Boolean(s.optional)).lastIndexOf(true);
    if (last === -1) break;
    kept.splice(last, 1);
  }
  return kept.map((section) => {
    const bare: LongSection = {
      heading: section.heading,
      paragraphs: section.paragraphs,
    };
    if (section.list) bare.list = section.list;
    if (section.close) bare.close = section.close;
    return bare;
  });
}

/** Word count, for checking against the benchmark. */
export function longWordCount(sections: LongSection[]): number {
  return sections
    .flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.list ? [s.list.intro, ...s.list.items] : []),
      ...(s.close ? [s.close] : []),
    ])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
