/**
 * Derives filter facets — colour, material, style, room, use — from what a
 * product document already says about itself.
 *
 * The rule this module exists to enforce: **a tag that is not supported by the
 * document's own text is not written.** A colour filter that returns a white
 * table when someone asked for black costs more trust than an empty filter does,
 * so every tag carries the string it was derived from and anything ambiguous is
 * dropped rather than guessed.
 *
 * Four things in this catalogue make naive keyword matching wrong, and each one
 * has a rule below:
 *
 *   1. Titles have an SEO tail. "Grafton Black Console Table | Industrial Oak
 *      Console Table" is a metal console with an oak drawer front — the tail's
 *      "Oak" is a material claim, not a colour. Colour is read from the first
 *      title segment only; material is read from the whole title.
 *
 *   2. Half the catalogue imitates a material it is not made of. The Crofton
 *      "White Marble" Coffee Table is recycled glass printed with a marble
 *      pattern; the Bamboo Gesso Table Lamp is gesso "inspired by the organic
 *      shape of bamboo"; the rattan lantern is a "rattan effect over a
 *      diffuser". A term shadowed anywhere in the document by -effect,
 *      -inspired, -style, -look, printed or faux is vetoed unless a Material
 *      spec names it outright.
 *
 *   3. Prose names colours that belong to the room, not the product: "easy to
 *      pair with neutral interiors", "styled beside a contemporary bed". A
 *      colour is only taken from a description when it directly qualifies a
 *      part of the object — "brown finish", "green chenille fabric", "slate
 *      grey metal frame" — never on its own.
 *
 *   4. Descriptions recommend styles rather than claim them: "complements
 *      Scandinavian, Japandi, rustic, modern and contemporary interiors alike"
 *      is not five style tags. Any sentence carrying a recommendation verb is
 *      skipped, and the style word still has to modify a design noun.
 *
 * Everything here is pure so it can be tested against the real strings — see
 * product-tags.test.ts. The Sanity read/write lives in
 * scripts/derive-product-tags.ts.
 */

// ---------------------------------------------------------------------------
// Input and output shapes
// ---------------------------------------------------------------------------

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductOption {
  label: string;
  values?: (string | null)[] | null;
}

/** Exactly the fields the derivation is allowed to read. Anything not in here
 *  cannot be used as evidence, which is the point. */
export interface TagInput {
  title: string;
  /** Primary category title, e.g. "Console Tables". */
  category?: string | null;
  /** Primary category slug — the reliable key; titles repeat ("Storage"). */
  categorySlug?: string | null;
  /** Slugs of `additionalCategories`. */
  extraCategorySlugs?: (string | null)[] | null;
  /** `category->department->title`, e.g. "Living Room". */
  department?: string | null;
  /** `additionalCategories[]->department->title`. */
  extraDepartments?: (string | null)[] | null;
  specs?: (ProductSpec | null)[] | null;
  options?: (ProductOption | null)[] | null;
  styleTags?: (string | null)[] | null;
  /** The description flattened with `pt::text()`. */
  description?: string | null;
}

export type TagSource =
  "title" | "spec" | "option" | "styleTag" | "taxonomy" | "description";

export interface DerivedTag {
  /** The canonical tag as written to Sanity. */
  tag: string;
  source: TagSource;
  /** The exact text this was read out of, for the dry-run to print. */
  evidence: string;
}

export interface DerivedFacets {
  /** The colour of the piece as listed and photographed. Null when the
   *  document does not say clearly enough — better an empty swatch than a
   *  wrong one. */
  primaryColour: DerivedTag | null;
  /** Every colour the product is genuinely available in, primary first. */
  colours: DerivedTag[];
  materials: DerivedTag[];
  styles: DerivedTag[];
  rooms: DerivedTag[];
  uses: DerivedTag[];
  /** Contradictions, vetoes and unmapped values — printed, never written. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** A canonical tag and every surface form of it seen in the data. */
interface Term {
  tag: string;
  aliases: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary matcher that tolerates the punctuation the data actually uses:
 * "Thermo-treated" for "thermo treated", "faux shagreen" hyphenated or not,
 * and an optional plural. `[a-z]` boundaries rather than `\b` so that "oak"
 * does not match inside "oakwood" — "Teakwood" is handled by listing it as its
 * own alias instead, because a term hiding inside a longer word is exactly how
 * a wrong tag gets written.
 */
function aliasRegex(alias: string): RegExp {
  const body = alias
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)
    .map(escapeRegExp)
    .join("[\\s-]+");
  return new RegExp(`(?<![a-z])${body}(e?s)?(?![a-z])`, "gi");
}

interface Match {
  tag: string;
  alias: string;
  start: number;
  end: number;
}

/** Every vocabulary term present in `text`, in the order they appear. */
function findTerms(text: string, vocabulary: Term[]): Match[] {
  const matches: Match[] = [];
  for (const term of vocabulary) {
    for (const alias of term.aliases) {
      for (const hit of text.matchAll(aliasRegex(alias))) {
        matches.push({
          tag: term.tag,
          alias,
          start: hit.index,
          end: hit.index + hit[0].length,
        });
      }
    }
  }
  // Longest alias wins at a given position, so "faux shagreen" is not also
  // reported as a bare "shagreen" further down the vocabulary.
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Match[] = [];
  for (const match of matches) {
    if (kept.some((k) => match.start < k.end && match.end > k.start)) continue;
    kept.push(match);
  }
  return kept;
}

/** Words that mark an imitation of a material rather than the material. */
const IMITATION_SUFFIX =
  "(?:effect|effects|inspired|style|styled|styling|look|lookalike|imitation|print|printed|pattern|patterned|finish[- ]?effect)";
const IMITATION_PREFIX =
  "(?:faux|imitation|mock|fake|inspired by|reminiscent of|in the style of|mimics|mimicking|resembling|replica of)";

/**
 * True when the document treats `alias` as an appearance rather than a
 * substance: "marble-effect top", "gold-style handles", "rattan effect over a
 * diffuser", "Inspired by the organic shape of bamboo".
 *
 * The prefix form allows a short window because the sentence that motivated it
 * puts five words between the two — "Inspired by the organic shape of bamboo".
 */
export function isImitated(text: string, alias: string): boolean {
  const body = alias
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)
    .map(escapeRegExp)
    .join("[\\s-]+");
  const after = new RegExp(`${body}(?:e?s)?[\\s-]*${IMITATION_SUFFIX}`, "i");
  const before = new RegExp(
    `${IMITATION_PREFIX}(?:\\s+\\w+){0,5}[\\s-]+${body}`,
    "i",
  );
  return after.test(text) || before.test(text);
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

/**
 * Wood tones the catalogue uses as colour values as well as materials —
 * `options` literally reads `Colour: Brown | Oak`. They are scored down when
 * choosing a primary colour, because "Black" on "Leckford Ribbed Black Oak"
 * describes the piece and "Oak" describes what it is made of.
 */
export const DUAL_WOOD_TONES = ["Oak", "Walnut"];

/** Tones that describe an absence of colour rather than a colour. Never
 *  preferred as the primary. */
export const GENERIC_TONES = ["Natural", "Neutral"];

export const COLOUR_VOCABULARY: Term[] = [
  { tag: "Black", aliases: ["black"] },
  // "whitewash" is NOT an alias of white, and the same goes for the other two
  // washes below. A wash is a finish over timber with the grain showing through;
  // a painted white hides it. They are different products on the shelf, so a
  // White filter must not return a whitewashed piece. The longest-alias rule in
  // findTerms is what stops "whitewash" also matching the bare "white".
  { tag: "White", aliases: ["white", "off white"] },
  { tag: "Whitewash", aliases: ["whitewash", "whitewashed", "limed"] },
  { tag: "Ivory", aliases: ["ivory"] },
  { tag: "Cream", aliases: ["cream"] },
  { tag: "Grey", aliases: ["grey", "gray", "slate grey", "pigeon grey"] },
  { tag: "Brown", aliases: ["brown", "chocolate brown", "chocolate"] },
  { tag: "Natural", aliases: ["natural"] },
  { tag: "Neutral", aliases: ["neutral"] },
  { tag: "Taupe", aliases: ["taupe"] },
  { tag: "Green", aliases: ["green", "sage"] },
  { tag: "Greenwash", aliases: ["greenwash", "greenwashed"] },
  { tag: "Blue", aliases: ["blue", "navy"] },
  { tag: "Bluewash", aliases: ["bluewash", "bluewashed"] },
  { tag: "Aqua", aliases: ["aqua", "turquoise"] },
  { tag: "Gold", aliases: ["gold", "golden"] },
  { tag: "Brass", aliases: ["brass"] },
  { tag: "Bronze", aliases: ["bronze"] },
  { tag: "Oak", aliases: ["oak"] },
  { tag: "Walnut", aliases: ["walnut"] },
];

export const MATERIAL_VOCABULARY: Term[] = [
  { tag: "Oak", aliases: ["oak"] },
  { tag: "Walnut", aliases: ["walnut"] },
  { tag: "Teak", aliases: ["teak", "teakwood"] },
  { tag: "Birch", aliases: ["birch"] },
  { tag: "Spruce", aliases: ["spruce"] },
  { tag: "Hemlock", aliases: ["hemlock"] },
  { tag: "Cedar", aliases: ["cedar"] },
  { tag: "Bamboo", aliases: ["bamboo"] },
  { tag: "Albasia wood", aliases: ["albasia", "albasia wood"] },
  { tag: "Gamal wood", aliases: ["gamal", "gamal wood"] },
  { tag: "Tamarind wood", aliases: ["tamarind", "tamarind wood"] },
  {
    tag: "Reclaimed wood",
    aliases: ["reclaimed wood", "recycled wood", "recycle wood", "reclaimed"],
  },
  { tag: "Painted wood", aliases: ["painted wood"] },
  { tag: "Wood", aliases: ["wood", "wooden", "timber"] },
  { tag: "MDF", aliases: ["mdf"] },
  { tag: "Rattan", aliases: ["rattan", "wicker"] },
  { tag: "Marble", aliases: ["marble"] },
  { tag: "Glass", aliases: ["glass", "tempered glass"] },
  { tag: "Mirrored glass", aliases: ["mirrored", "mirror glass"] },
  { tag: "Steel", aliases: ["steel", "stainless steel", "enamelled steel"] },
  { tag: "Metal", aliases: ["metal", "metal runners", "iron"] },
  { tag: "Brass", aliases: ["brass"] },
  { tag: "Gesso", aliases: ["gesso"] },
  { tag: "Faux shagreen", aliases: ["faux shagreen", "shagreen"] },
  { tag: "Faux concrete", aliases: ["faux concrete"] },
  { tag: "Concrete", aliases: ["concrete"] },
  { tag: "Resin", aliases: ["resin"] },
  { tag: "Chenille", aliases: ["chenille"] },
  { tag: "Bouclé", aliases: ["boucle", "bouclé"] },
  { tag: "Linen", aliases: ["linen"] },
  { tag: "Velvet", aliases: ["velvet"] },
  { tag: "Fabric", aliases: ["fabric", "upholstered", "upholstery"] },
  { tag: "High gloss", aliases: ["high gloss", "gloss"] },
  {
    tag: "Himalayan salt",
    aliases: ["himalayan salt", "himalayan rock salt", "rock salt"],
  },
];

export const STYLE_VOCABULARY: Term[] = [
  { tag: "Modern", aliases: ["modern", "contemporary"] },
  { tag: "Minimal", aliases: ["minimal", "minimalist"] },
  { tag: "Industrial", aliases: ["industrial"] },
  { tag: "Rustic", aliases: ["rustic", "vintage & reclaimed", "vintage"] },
  { tag: "Scandinavian", aliases: ["scandinavian", "scandi"] },
  { tag: "Art Deco", aliases: ["art deco"] },
  { tag: "Coastal", aliases: ["coastal"] },
  { tag: "Traditional", aliases: ["traditional", "classic"] },
];

/**
 * Style words in a title or a Style spec are the seller's own claim about the
 * piece and are taken at face value. In a description they are not: see
 * `stylesFromDescription`.
 */
const STYLE_DESIGN_NOUNS = [
  "styling",
  "style",
  "design",
  "designs",
  "aesthetic",
  "detail",
  "detailing",
  "elegance",
  "influence",
  "silhouette",
  "lines",
  "look",
  "glamour",
  "form",
];

/** Sentences that recommend rather than describe. "Complements Scandinavian,
 *  Japandi, rustic, modern and contemporary interiors alike" is not five tags. */
const RECOMMENDATION_MARKERS = [
  "complement",
  "at home in",
  "suited to",
  "suits",
  "works with",
  "work with",
  "pair",
  "pairs",
  "ideal for",
  "perfect for",
  "equally",
  "whether",
  "alike",
  "interiors seeking",
];

/**
 * Parts of an object. A colour or material in prose only counts when it
 * qualifies one of these — "grey aged oak frame" yes, "neutral interiors" no.
 */
const COMPONENT_NOUNS = [
  "top",
  "tops",
  "tabletop",
  "worktop",
  "frame",
  "frames",
  "leg",
  "legs",
  "base",
  "body",
  "drawer",
  "drawers",
  "front",
  "fronts",
  "door",
  "doors",
  "shade",
  "fabric",
  "upholstery",
  "panel",
  "panels",
  "surface",
  "surfaces",
  "veneer",
  "seam",
  "handle",
  "handles",
  "shelf",
  "shelves",
  "lattice",
  "finish",
  "seat",
  "cushion",
  "cushions",
  "bottle",
  "grain",
  "wood",
  "timber",
  "stand",
  "stands",
  "carcass",
  "runners",
  "hardware",
  "chest",
  "table",
  "sofa",
  "chair",
  "unit",
  "lamp",
  "lantern",
  "mirror",
  "sideboard",
];

/** Phrases that introduce what a thing is made of. */
const CONSTRUCTION_PHRASES = [
  "crafted from",
  "handcrafted from",
  "handmade from",
  "made from",
  "made of",
  "constructed from",
  "constructed using",
  "built from",
  "upholstered in",
  "finished in",
  "finished with",
  "combining",
  "combines",
  "supported by",
  "featuring",
  "features a",
  "features an",
  "blends",
  "in solid",
  "solid",
];

// ---------------------------------------------------------------------------
// Reading the document
// ---------------------------------------------------------------------------

/**
 * The title without its SEO tail or the trailing brand.
 *
 * "Abberley White End Table | Luxury Oak Side Table | Kaiku" is three claims of
 * decreasing reliability: the product's name, a keyword line, and the shop's
 * name. Colour comes from the first only.
 */
export function titleSegments(title: string): string[] {
  return title
    .split("|")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !/^kaiku$/i.test(segment));
}

export function productName(title: string): string {
  return titleSegments(title)[0] ?? "";
}

function specs(input: TagInput): ProductSpec[] {
  return (input.specs ?? []).filter(
    (spec): spec is ProductSpec =>
      !!spec &&
      typeof spec.label === "string" &&
      typeof spec.value === "string",
  );
}

/** Spec rows whose label matches, compared loosely — the data contains
 *  "Colour", "Colour " and "Materials" for the same idea. */
function specsLabelled(input: TagInput, labels: string[]): ProductSpec[] {
  const wanted = labels.map((l) => l.toLowerCase());
  return specs(input).filter((spec) =>
    wanted.includes(spec.label.trim().toLowerCase()),
  );
}

/**
 * A template value that says nothing. It sits on seven D.I. Designs tables,
 * one of which is recycled glass and powder-coated steel — so believing it
 * would put a glass table in a "solid wood" filter.
 */
export const EMPTY_MATERIAL_SPEC_VALUES = [
  "solid wood and quality finishes",
  "quality finishes",
  "various",
  "n/a",
];

function isEmptyMaterialValue(value: string): boolean {
  return EMPTY_MATERIAL_SPEC_VALUES.includes(value.trim().toLowerCase());
}

/** Colour-bearing option lists. Labels in the data include "Colour" and
 *  "Colour " with a trailing space. */
function colourOptions(input: TagInput): { label: string; values: string[] }[] {
  return (input.options ?? [])
    .filter((option): option is ProductOption => !!option)
    .filter((option) => /colour|color|finish/i.test(option.label ?? ""))
    .map((option) => ({
      label: (option.label ?? "").trim(),
      values: (option.values ?? [])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    }));
}

function unique(tags: DerivedTag[]): DerivedTag[] {
  const seen = new Set<string>();
  return tags.filter((tag) => {
    if (seen.has(tag.tag)) return false;
    seen.add(tag.tag);
    return true;
  });
}

function sentences(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zé]+/)
    .filter(Boolean);
}

/**
 * True when the match is followed, within three words, by a part of the object.
 * The window is three because "white marble-effect top" and "green textured
 * chenille fabric" both need more than one.
 */
function qualifiesComponent(text: string, match: Match): boolean {
  const after = words(text.slice(match.end)).slice(0, 3);
  return after.some((word) => COMPONENT_NOUNS.includes(word));
}

function followsConstruction(text: string, match: Match): boolean {
  const before = text.slice(0, match.start).toLowerCase();
  const tail = before.slice(-40);
  return CONSTRUCTION_PHRASES.some((phrase) => tail.includes(phrase));
}

/** Trimmed context around a match, for the dry-run to print as evidence. */
function excerpt(text: string, match: Match): string {
  const start = Math.max(0, match.start - 45);
  const end = Math.min(text.length, match.end + 45);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/**
 * Colour, in descending order of how much the data can be trusted.
 *
 *   title (first segment)  "Abberley White Chest of Drawers" — the name of the
 *                          thing. Highest confidence; also decides the primary.
 *   Colour / Finish spec   Labelled, structured. Often lists more than one
 *                          ("Colour: Brass, Ivory" — an ivory shagreen console
 *                          with a brass frame), so it feeds `colours` but only
 *                          decides the primary when it names exactly one.
 *   Colour option values   What the range is available in. The owner wants the
 *                          product to appear on those filters.
 *   description            Only where the colour qualifies a part of the piece.
 *
 * Everything is checked against the imitation veto, which is what stops
 * "gold-style semi-circular handles" from tagging a chest Gold.
 */
export function deriveColours(input: TagInput): {
  colours: DerivedTag[];
  primaryColour: DerivedTag | null;
  notes: string[];
} {
  const notes: string[] = [];
  const document = documentText(input);

  const name = productName(input.title);
  const titleMatches = findTerms(name, COLOUR_VOCABULARY).filter((match) => {
    if (!isImitated(document, match.alias)) return true;
    notes.push(
      `colour "${match.tag}" in the title is an imitation elsewhere in the document — not tagged`,
    );
    return false;
  });
  const fromTitle: DerivedTag[] = titleMatches.map((match) => ({
    tag: match.tag,
    source: "title" as const,
    evidence: `title "${name}"`,
  }));

  const fromSpec: DerivedTag[] = [];
  for (const spec of specsLabelled(input, [
    "colour",
    "colours",
    "color",
    "finish",
  ])) {
    const matches = findTerms(spec.value, COLOUR_VOCABULARY);
    for (const match of matches) {
      if (isImitated(spec.value, match.alias)) continue;
      fromSpec.push({
        tag: match.tag,
        source: "spec",
        evidence: `spec ${spec.label.trim()} = "${spec.value}"`,
      });
    }
    if (!matches.length)
      notes.push(
        `spec ${spec.label.trim()} = "${spec.value}" — no colour in the vocabulary matched`,
      );
  }

  const fromOptions: DerivedTag[] = [];
  for (const option of colourOptions(input)) {
    for (const value of option.values) {
      const matches = findTerms(value, COLOUR_VOCABULARY);
      if (!matches.length) {
        notes.push(
          `option ${option.label} = "${value}" — not a colour in the vocabulary, skipped`,
        );
        continue;
      }
      for (const match of matches)
        fromOptions.push({
          tag: match.tag,
          source: "option",
          evidence: `option ${option.label} = "${value}"`,
        });
    }
  }

  const fromDescription: DerivedTag[] = [];
  if (input.description) {
    for (const match of findTerms(input.description, COLOUR_VOCABULARY)) {
      if (!qualifiesComponent(input.description, match)) continue;
      if (isImitated(document, match.alias)) continue;
      fromDescription.push({
        tag: match.tag,
        source: "description",
        evidence: `description "${excerpt(input.description, match)}"`,
      });
    }
  }

  const specTags = new Set(fromSpec.map((tag) => tag.tag));
  const optionTags = new Set(fromOptions.map((tag) => tag.tag));

  // The primary is what the listing is: the piece in the photographs.
  let primaryColour: DerivedTag | null = null;
  if (fromTitle.length) {
    const scored = fromTitle.map((tag, index) => ({
      tag,
      index,
      score:
        (DUAL_WOOD_TONES.includes(tag.tag) ? 0 : 2) +
        (specTags.has(tag.tag) ? 1 : 0) -
        (GENERIC_TONES.includes(tag.tag) ? 1 : 0),
    }));
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
    primaryColour = scored[0]!.tag;
  } else if (specTags.size === 1) {
    primaryColour = fromSpec[0]!;
  } else if (specTags.size > 1) {
    notes.push(
      `no colour in the product name and ${specTags.size} in the Colour spec — left without a primary colour`,
    );
  }

  // Contradiction worth a human's eyes: the name says one thing and the
  // structured fields never mention it. Grafton Black Bedside Table has
  // Colour: Grey; Hampton Brown Shagreen Console lists Grey and Ivory.
  if (
    primaryColour &&
    primaryColour.source === "title" &&
    (specTags.size || optionTags.size) &&
    !specTags.has(primaryColour.tag) &&
    !optionTags.has(primaryColour.tag)
  )
    notes.push(
      `title says ${primaryColour.tag}; Colour spec/options say ${[...new Set([...specTags, ...optionTags])].join(", ")} — title kept as primary`,
    );

  const colours = unique(
    [
      ...(primaryColour ? [primaryColour] : []),
      ...fromTitle,
      ...fromSpec,
      ...fromOptions,
      ...fromDescription,
    ].filter(Boolean),
  );

  return { colours, primaryColour, notes };
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

/** Title, specs and description joined — the text the imitation veto reads. */
function documentText(input: TagInput): string {
  return [
    input.title,
    ...specs(input).map((spec) => `${spec.label}: ${spec.value}`),
    input.description ?? "",
  ].join("\n");
}

/**
 * Material, from the whole title, the material-ish specs, and construction
 * phrases in the description.
 *
 * The description matters more here than anywhere else: seven D.I. Designs
 * tables carry the spec value "Solid wood and quality finishes", and it is the
 * description that says the Witley is "a grey aged oak frame with a tempered
 * glass top and woven rattan lattice detail".
 *
 * A spec value that names the material outright also overrides the imitation
 * veto — Grafton's "Faux Concrete" survives its own description calling it a
 * "faux concrete-effect top", because the canonical tag already says faux.
 */
export function deriveMaterials(input: TagInput): {
  materials: DerivedTag[];
  notes: string[];
} {
  const notes: string[] = [];
  const document = documentText(input);
  const found: DerivedTag[] = [];

  // Spec first, so its aliases are the ones that can override the veto.
  const declared = new Set<string>();
  for (const spec of specsLabelled(input, [
    "material",
    "materials",
    "body",
    "legs",
    "frame",
    "fabric",
    "finish",
    "construction",
  ])) {
    if (isEmptyMaterialValue(spec.value)) {
      notes.push(
        `spec ${spec.label.trim()} = "${spec.value}" — template value, no material read from it`,
      );
      continue;
    }
    for (const match of findTerms(spec.value, MATERIAL_VOCABULARY)) {
      if (isImitated(spec.value, match.alias)) {
        notes.push(
          `material "${match.tag}" not tagged — spec ${spec.label.trim()} calls it an imitation: "${spec.value}"`,
        );
        continue;
      }
      declared.add(match.tag);
      found.push({
        tag: match.tag,
        source: "spec",
        evidence: `spec ${spec.label.trim()} = "${spec.value}"`,
      });
    }
  }

  for (const segment of titleSegments(input.title)) {
    for (const match of findTerms(segment, MATERIAL_VOCABULARY)) {
      if (declared.has(match.tag)) {
        found.push({
          tag: match.tag,
          source: "title",
          evidence: `title "${segment}"`,
        });
        continue;
      }
      if (isImitated(document, match.alias)) {
        notes.push(
          `material "${match.tag}" in the title is not tagged — the document calls it an imitation (e.g. ${match.alias}-effect / inspired by ${match.alias})`,
        );
        continue;
      }
      found.push({
        tag: match.tag,
        source: "title",
        evidence: `title "${segment}"`,
      });
    }
  }

  if (input.description) {
    for (const match of findTerms(input.description, MATERIAL_VOCABULARY)) {
      const grounded =
        qualifiesComponent(input.description, match) ||
        followsConstruction(input.description, match);
      if (!grounded) continue;
      if (!declared.has(match.tag) && isImitated(document, match.alias)) {
        notes.push(
          `material "${match.tag}" in the description is an imitation, not tagged`,
        );
        continue;
      }
      found.push({
        tag: match.tag,
        source: "description",
        evidence: `description "${excerpt(input.description, match)}"`,
      });
    }
  }

  // "Wood" adds nothing next to the species, and "Reclaimed wood" already
  // implies it. Both stay when nothing more specific was found.
  const materials = unique(found);
  const specific = materials.filter(
    (material) =>
      material.tag !== "Wood" &&
      ["Oak", "Walnut", "Teak", "Birch", "Spruce", "Hemlock", "Cedar"].includes(
        material.tag,
      ),
  );
  return {
    materials: specific.length
      ? materials.filter((material) => material.tag !== "Wood")
      : materials,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

/**
 * Style words from prose, under two conditions: the sentence must describe the
 * piece rather than recommend it, and the word must modify a design noun.
 *
 * "captures the glamour of Art Deco styling" qualifies. "making it equally at
 * home in contemporary, Scandinavian, industrial or luxury interiors" does not,
 * and it is the reason this function is not simply a keyword scan — that one
 * sentence would put a tamarind coffee table in three style filters.
 */
export function stylesFromDescription(description: string): DerivedTag[] {
  const found: DerivedTag[] = [];
  for (const sentence of sentences(description)) {
    const lower = sentence.toLowerCase();
    if (RECOMMENDATION_MARKERS.some((marker) => lower.includes(marker)))
      continue;
    for (const match of findTerms(sentence, STYLE_VOCABULARY)) {
      const after = words(sentence.slice(match.end)).slice(0, 2);
      if (!after.some((word) => STYLE_DESIGN_NOUNS.includes(word))) continue;
      found.push({
        tag: match.tag,
        source: "description",
        evidence: `description "${excerpt(sentence, match)}"`,
      });
    }
  }
  return unique(found);
}

export function deriveStyles(input: TagInput): {
  styles: DerivedTag[];
  notes: string[];
} {
  const notes: string[] = [];
  const found: DerivedTag[] = [];

  for (const segment of titleSegments(input.title))
    for (const match of findTerms(segment, STYLE_VOCABULARY))
      found.push({
        tag: match.tag,
        source: "title",
        evidence: `title "${segment}"`,
      });

  for (const spec of specsLabelled(input, ["style", "design"]))
    for (const match of findTerms(spec.value, STYLE_VOCABULARY))
      found.push({
        tag: match.tag,
        source: "spec",
        evidence: `spec ${spec.label.trim()} = "${spec.value}"`,
      });

  // styleTags is a free-text field holding a mix of styles, colours and uses
  // ("Modern", "Ivory", "Coffee Table"). Only the style words are read; the
  // field itself is left exactly as it is.
  for (const raw of input.styleTags ?? []) {
    if (!raw) continue;
    const matches = findTerms(raw, STYLE_VOCABULARY);
    for (const match of matches)
      found.push({
        tag: match.tag,
        source: "styleTag",
        evidence: `styleTags "${raw}"`,
      });
  }

  if (input.description)
    found.push(...stylesFromDescription(input.description));

  return { styles: unique(found), notes };
}

// ---------------------------------------------------------------------------
// Room and use
// ---------------------------------------------------------------------------

/**
 * Departments are the site's rooms, with three that are not rooms at all.
 *
 * Lighting, Cold Plunge and Outdoor Kitchen are merchandising departments — a
 * table lamp's department says nothing about which room it belongs in, so those
 * products get a room only if the taxonomy or the name says so elsewhere. An
 * empty Room facet on six lamps is the honest answer; guessing "Living room"
 * for all of them is not.
 */
const DEPARTMENT_ROOMS: Record<string, string | null> = {
  "living room": "Living room",
  bedroom: "Bedroom",
  office: "Office",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  sauna: "Sauna",
  "outdoor living": "Garden",
  "outdoor kitchen": "Garden",
  garden: "Garden",
  lighting: null,
  "cold plunge": null,
};

/** Room words in a product's own name: "Home Office Desk", "Solar Garden Lamp
 *  Post". Read from the whole title — an SEO tail naming a room is still the
 *  shop's own claim about where the thing goes. */
const ROOM_NAME_TERMS: Term[] = [
  { tag: "Living room", aliases: ["living room", "lounge"] },
  { tag: "Bedroom", aliases: ["bedroom", "bedside"] },
  { tag: "Office", aliases: ["home office", "office", "desk"] },
  { tag: "Bathroom", aliases: ["bathroom"] },
  { tag: "Garden", aliases: ["garden", "outdoor", "patio"] },
  { tag: "Sauna", aliases: ["sauna"] },
];

export function deriveRooms(input: TagInput): {
  rooms: DerivedTag[];
  notes: string[];
} {
  const notes: string[] = [];
  const found: DerivedTag[] = [];

  const departments: { name: string; via: string }[] = [
    ...(input.department ? [{ name: input.department, via: "category" }] : []),
    ...(input.extraDepartments ?? [])
      .filter((name): name is string => !!name)
      .map((name) => ({ name, via: "additionalCategories" })),
  ];
  for (const department of departments) {
    const key = department.name.trim().toLowerCase();
    if (!(key in DEPARTMENT_ROOMS)) {
      notes.push(`department "${department.name}" is not mapped to a room`);
      continue;
    }
    const room = DEPARTMENT_ROOMS[key];
    if (!room) continue;
    found.push({
      tag: room,
      source: "taxonomy",
      evidence: `${department.via} → department "${department.name}"`,
    });
  }

  for (const segment of titleSegments(input.title))
    for (const match of findTerms(segment, ROOM_NAME_TERMS))
      found.push({
        tag: match.tag,
        source: "title",
        evidence: `title "${segment}"`,
      });

  return { rooms: unique(found), notes };
}

/** What the thing is for, keyed off the category it is filed under. */
const CATEGORY_USES: Record<string, string[]> = {
  "bedside-tables": ["Bedside table"],
  "coffee-tables": ["Coffee table"],
  "console-tables": ["Console"],
  "side-tables": ["Side table"],
  desks: ["Desk"],
  sofas: ["Seating"],
  "bathroom-mirrors": ["Mirror"],
  mirrors: ["Mirror"],
  lighting: ["Lighting"],
  "garden-lighting": ["Lighting"],
  "tv-units": ["TV unit", "Storage"],
  storage: ["Storage"],
  "living-room-storage": ["Storage"],
  "bedroom-storage": ["Storage"],
  "outdoor-storage": ["Storage"],
  shelving: ["Shelving"],
  planters: ["Planter"],
  "indoor-saunas": ["Sauna"],
  "outdoor-saunas": ["Sauna"],
  "cold-plunges": ["Cold plunge"],
  "outdoor-kitchens": ["Outdoor cooking"],
  "water-features": ["Water feature"],
  "wellness-accessories": ["Wellness"],
  "garden-furniture": [],
  // A collection, not a use — these products' uses come from their names and
  // their secondary categories.
  "rustic-reclaimed-furniture": [],
  "dining-tables": ["Dining"],
};

/** Use words in a product's name, and in styleTags — which for the reclaimed
 *  range is where the use actually lives ("Bedside Table", "TV Stand"). */
const USE_TERMS: Term[] = [
  { tag: "Coffee table", aliases: ["coffee table"] },
  { tag: "Console", aliases: ["console table", "console", "media console"] },
  {
    tag: "Side table",
    aliases: [
      "side table",
      "end table",
      "occasional table",
      "nest of tables",
      "nesting table",
      "lamp table",
    ],
  },
  {
    tag: "Bedside table",
    aliases: ["bedside table", "bedside cabinet", "nightstand"],
  },
  { tag: "Dining", aliases: ["dining table", "dining"] },
  { tag: "Desk", aliases: ["desk"] },
  {
    tag: "Seating",
    aliases: ["sofa", "armchair", "club chair", "chair", "stool", "bench"],
  },
  {
    tag: "Storage",
    aliases: [
      "chest of drawers",
      "chest",
      "sideboard",
      "storage",
      "crate",
      "tub",
      "cabinet",
      "drawer",
      "trunk",
    ],
  },
  {
    tag: "Shelving",
    aliases: [
      "shelving",
      "shelf",
      "bookcase",
      "display unit",
      "display stand",
      "display",
    ],
  },
  { tag: "Mirror", aliases: ["mirror"] },
  {
    tag: "Lighting",
    aliases: [
      "table lamp",
      "floor lamp",
      "lamp post",
      "lamp",
      "lantern",
      "lighting",
      "pendant",
      "light",
    ],
  },
  { tag: "TV unit", aliases: ["tv unit", "tv stand", "media unit"] },
  { tag: "Planter", aliases: ["plant stand", "planter", "plant pot"] },
  { tag: "Sauna", aliases: ["sauna"] },
  { tag: "Cold plunge", aliases: ["ice bath", "cold plunge", "plunge pool"] },
  {
    tag: "Outdoor cooking",
    aliases: ["bbq", "barbecue", "grill", "pizza oven"],
  },
  { tag: "Water feature", aliases: ["water feature", "fountain"] },
  { tag: "Wellness", aliases: ["essential oil", "aromatherapy"] },
];

export function deriveUses(input: TagInput): {
  uses: DerivedTag[];
  notes: string[];
} {
  const notes: string[] = [];
  const found: DerivedTag[] = [];

  const categorySlugs = [
    input.categorySlug,
    ...(input.extraCategorySlugs ?? []),
  ].filter((slug): slug is string => !!slug);

  for (const slug of categorySlugs) {
    if (!(slug in CATEGORY_USES)) {
      notes.push(`category "${slug}" is not mapped to a use`);
      continue;
    }
    for (const use of CATEGORY_USES[slug]!)
      found.push({
        tag: use,
        source: "taxonomy",
        evidence: `category "${slug}"`,
      });
  }

  for (const segment of titleSegments(input.title))
    for (const match of findTerms(segment, USE_TERMS))
      found.push({
        tag: match.tag,
        source: "title",
        evidence: `title "${segment}"`,
      });

  for (const raw of input.styleTags ?? []) {
    if (!raw) continue;
    for (const match of findTerms(raw, USE_TERMS))
      found.push({
        tag: match.tag,
        source: "styleTag",
        evidence: `styleTags "${raw}"`,
      });
  }

  return { uses: unique(found), notes };
}

// ---------------------------------------------------------------------------
// Everything
// ---------------------------------------------------------------------------

export function deriveFacets(input: TagInput): DerivedFacets {
  const colour = deriveColours(input);
  const material = deriveMaterials(input);
  const style = deriveStyles(input);
  const room = deriveRooms(input);
  const use = deriveUses(input);

  return {
    primaryColour: colour.primaryColour,
    colours: colour.colours,
    materials: material.materials,
    styles: style.styles,
    rooms: room.rooms,
    uses: use.uses,
    notes: [
      ...colour.notes,
      ...material.notes,
      ...style.notes,
      ...room.notes,
      ...use.notes,
    ],
  };
}

/** The tag strings only, in the shape written to Sanity. */
export function facetValues(facets: DerivedFacets): {
  primaryColour: string | null;
  colours: string[];
  materials: string[];
  styles: string[];
  rooms: string[];
  uses: string[];
} {
  return {
    primaryColour: facets.primaryColour?.tag ?? null,
    colours: facets.colours.map((tag) => tag.tag),
    materials: facets.materials.map((tag) => tag.tag),
    styles: facets.styles.map((tag) => tag.tag),
    rooms: facets.rooms.map((tag) => tag.tag),
    uses: facets.uses.map((tag) => tag.tag),
  };
}
