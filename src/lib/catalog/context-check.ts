/**
 * Finds copy that describes a product as if it lived somewhere it does not.
 *
 * The first fault the long-form writer shipped was telling a pergola buyer how
 * the piece would read "in the room". Damien asked for every product to be
 * checked for the same class of mistake, and it is worth checking properly:
 * it is the one kind of error a shopper notices immediately and cannot explain
 * away. A garden product that talks about your hallway was not written by
 * anyone who looked at it.
 *
 * The checks are deliberately narrow. "Room to spare" and "outdoor room" are
 * ordinary English and must not fire; "in the living room" on a pergola must.
 * Every pattern here earns its place by catching a real sentence in the
 * catalogue, and the tests hold the false positives out.
 */

/** Where a product is actually used. */
export type Siting = "outdoor" | "indoor" | "either";

/**
 * Category → siting.
 *
 * Kept separate from `familyFor` in describe.ts on purpose. That maps category
 * to a *writing* family — an outdoor sauna writes like wellness copy — whereas
 * this answers the different question of whether the thing stands in the rain.
 * Conflating the two is how an outdoor sauna ends up being told about its
 * hallway.
 */
const SITING_BY_CATEGORY: Record<string, Siting> = {
  "Garden Furniture": "outdoor",
  "Garden Lighting": "outdoor",
  "Fire Pits & Heating": "outdoor",
  Pergolas: "outdoor",
  "Water Features": "outdoor",
  "Privacy Screens": "outdoor",
  "Outdoor Kitchens": "outdoor",
  "Outdoor Saunas": "outdoor",
  Planters: "either",
  "Cold Plunges": "either",
  "Candles & Lanterns": "either",
  Accessories: "either",
  "Christmas Decorations": "either",
  "Christmas Trees": "either",
  "Wellness Accessories": "either",
  "Indoor Saunas": "indoor",
  Vases: "indoor",
  Lighting: "indoor",
  Mirrors: "indoor",
  "Wall Art": "indoor",
  "Wall Clocks": "indoor",
  Furniture: "indoor",
  Storage: "indoor",
  Sofas: "indoor",
  "Console Tables": "indoor",
  "Coffee Tables": "indoor",
  "Side Tables": "indoor",
  "Bedside Tables": "indoor",
  "TV Units": "indoor",
  Beds: "indoor",
  Desks: "indoor",
  Shelving: "indoor",
  "The Reclaimed Collection": "indoor",
};

/**
 * A category we do not recognise returns "either", so nothing is flagged.
 *
 * The alternative — defaulting to indoor, as `familyFor` does — would invent
 * findings for every new category anyone adds. A missed fault is recoverable;
 * a report full of noise gets ignored, and then the real faults go with it.
 */
export function sitingFor(category?: string | null): Siting {
  return SITING_BY_CATEGORY[(category ?? "").trim()] ?? "either";
}

export interface ContextFault {
  /** The offending phrase, as written. */
  phrase: string;
  /** The sentence it appears in, for the report. */
  sentence: string;
  kind: "indoor-language-outdoor-product" | "outdoor-language-indoor-product";
}

/**
 * Indoor-only language, wrong on a product that lives outside.
 *
 * `roomExceptions` carries the phrases that contain a banned substring but are
 * perfectly good English — without them "room to spare" and "outdoor room"
 * both fire, and the report is instantly worthless.
 */
const INDOOR_PHRASES = [
  "in the room",
  "in a room",
  "in your room",
  "across the room",
  // One pattern, not three: "the room feels" / "a room feeling" / "room felt"
  // all sit inside this, and overlapping patterns report one slip twice.
  "room feel*",
  "living room*",
  "dining room*",
  "bedroom*",
  "hallway*",
  "landing*",
  "stairwell*",
  "mantelpiece*",
  "windowsill*",
  "sideboard*",
  // "coffee table" is deliberately absent. Rattan outdoor coffee tables are a
  // real product and a whole category of ours; banning the phrase produced 18
  // findings and every one of them was wrong.
  "bedside",
  "interior scheme",
  "in the interior",
  "your interior",
  "indoor space",
  "low ceiling",
  "the ceiling",
  "wall to wall",
  "carpet*",
  "skirting*",
  "radiator*",
  // "curtains" is deliberately absent: our gazebos and pergolas genuinely ship
  // with side curtains, and the phrase flagged five of them wrongly.
  "cushions and throws",
  "houseplant*",
];

/** Outdoor-only language, wrong on a product that never leaves the house. */
const OUTDOOR_PHRASES = [
  "patio*",
  "decking",
  "paving",
  "in the garden",
  "your garden",
  "garden feel",
  "weatherproof",
  "weather-resistant",
  "all weathers",
  "rain and frost",
  "frost",
  "frosts",
  "outdoor dining*",
  "on the terrace",
  "poolside",
  "gravel",
  "trellis*",
  "planting scheme*",
  "lawn*",
  "hose it down",
  "over winter outside",
];

/**
 * Phrases that legitimately contain a banned substring.
 *
 * Checked before the ban, longest first, so "outdoor room" is consumed before
 * "in a room" can match inside it.
 */
const EXCEPTIONS = [
  "outdoor room",
  "garden room",
  "room to spare",
  "has room",
  "have room",
  "room for",
  "make room",
  "enough room",
  "more room",
  "room around",
  "leaves room",
  "shower room",
  "boot room",
  "utility room",
  "treatment room",
  "spa room",
  "changing room",
  "plant room",
  "the garden feels like",
  "cut flowers from the garden",
  "foliage from the garden",
  "grasses from the garden",
  "brings the garden",
  "garden-inspired",
  "garden office",
  "winter garden",
];

/**
 * Words that name the product's *correct* place.
 *
 * A sentence saying "ideal for any garden, patio, or even a spacious living
 * room" is not a mismatch — it is a hanging chair that genuinely works in both,
 * and the writer knew it. Only copy that names the wrong place *instead of* the
 * right one is a fault.
 */
const CORRECT_PLACE: Record<"outdoor" | "indoor", string[]> = {
  outdoor: [
    "garden",
    "patio",
    "terrace",
    "decking",
    "outdoor",
    "outside",
    "balcony",
    "courtyard",
    "poolside",
    "al fresco",
    "yard",
  ],
  indoor: [
    "indoor",
    "inside",
    "interior",
    "living space",
    "in the home",
    "your home",
    "the house",
    "room",
  ],
};

/** Splits into sentences without losing the terminator. */
function sentencesOf(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Blanks the exception phrases so a ban cannot match inside one. */
function maskExceptions(lower: string): string {
  let masked = lower;
  for (const exception of [...EXCEPTIONS].sort((a, b) => b.length - a.length)) {
    masked = masked.split(exception).join(" ".repeat(exception.length));
  }
  return masked;
}

/**
 * Whole-word matching, with an explicit opt-in to suffixes.
 *
 * Plain `includes` matched "frost" inside "Frosted Glass Pendant Light" and
 * inside "frosted velvet upholstery", reporting a lighting product and a bed
 * as though they had been left out in the weather. So a phrase has to end
 * where the word ends — except where we actually want the inflections, which a
 * trailing `*` asks for: "room feel*" catches "the room feels" and "a room
 * feeling", while "frost" stays exact. Guessing which phrases want suffixes is
 * what produced those two false positives, so each one now says.
 */
function wordMatch(haystack: string, phrase: string): number {
  const anySuffix = phrase.endsWith("*");
  const stem = anySuffix ? phrase.slice(0, -1) : phrase;
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tail = anySuffix ? "" : "(?![a-z])";
  const found = new RegExp(`(?<![a-z])${escaped}${tail}`).exec(haystack);
  return found ? found.index : -1;
}

/** The phrase as it should read in a report, without the suffix marker. */
function displayPhrase(phrase: string): string {
  return phrase.endsWith("*") ? phrase.slice(0, -1).trim() : phrase;
}

/**
 * Every context fault in a description.
 *
 * Takes plain text rather than Portable Text so it can be tested without a
 * Sanity document, and so the same function serves the audit script and the
 * admin screen.
 */
export function contextFaults(text: string, siting: Siting): ContextFault[] {
  if (siting === "either" || !text.trim()) return [];
  const banned = siting === "outdoor" ? INDOOR_PHRASES : OUTDOOR_PHRASES;
  const kind =
    siting === "outdoor"
      ? ("indoor-language-outdoor-product" as const)
      : ("outdoor-language-indoor-product" as const);

  const faults: ContextFault[] = [];
  const seen = new Set<string>();
  for (const sentence of sentencesOf(text)) {
    let masked = maskExceptions(sentence.toLowerCase());
    // Longest first, blanking each hit as it is taken, so two patterns that
    // overlap in the same words report the fault once rather than twice.
    for (const phrase of [...banned].sort((a, b) => b.length - a.length)) {
      const at = wordMatch(masked, phrase);
      if (at === -1) continue;
      masked =
        masked.slice(0, at) +
        " ".repeat(phrase.length) +
        masked.slice(at + phrase.length);
      // One finding per phrase per product: the same slip repeated eight times
      // is one thing to fix, and eight rows hides the other seven faults.
      if (seen.has(phrase)) continue;
      // Skip a sentence that also names where the product really goes: that is
      // a writer covering both uses, not one describing the wrong place.
      const lower = sentence.toLowerCase();
      if (CORRECT_PLACE[siting].some((word) => lower.includes(word))) continue;
      seen.add(phrase);
      faults.push({ phrase: displayPhrase(phrase), sentence, kind });
    }
  }
  return faults;
}
