/**
 * Minor wording faults across the catalogue.
 *
 * Damien asked for "minor issues in wording similar to that" — the class of
 * fault the pergola's "in the room" belonged to, rather than that exact fault.
 * These are the small slips that individually look trivial and collectively
 * make a page read as though nobody checked it: an article that disagrees with
 * the word after it, a measurement in the prose that contradicts the recorded
 * dimensions, a "set of four" described as three, a leftover "TBC".
 *
 * Two rules govern what belongs here.
 *
 * The first is precision. A report with a thousand rows nobody trusts is worse
 * than no report, because the real faults drown. Every check either compares
 * the copy against a fact we hold — which cannot be a matter of taste — or
 * matches a pattern that has no innocent reading. Anything that needs
 * judgement is left out.
 *
 * The second is that the copy is checked against the product, not against a
 * style guide. "Holds up to 50kg" is only a fault when 50kg happens to be the
 * product's own shipping weight, which is the mistake that got made three
 * times by hand earlier in this project.
 */

export interface WordingFault {
  /** Stable identifier so the audit can group and count. */
  check: WordingCheck;
  /** What is wrong, in a sentence, naming the values that disagree. */
  message: string;
  /** The sentence or fragment it appears in. */
  context: string;
}

export type WordingCheck =
  | "article-disagreement"
  | "repeated-word"
  | "placeholder-left-in"
  | "mixed-units"
  | "dimension-contradiction"
  | "colour-contradiction"
  | "quantity-contradiction"
  | "lead-time-contradiction"
  | "assembly-contradiction"
  | "weight-as-capacity"
  | "spacing-before-punctuation"
  | "doubled-punctuation"
  | "unbalanced-brackets"
  | "sentence-starts-lowercase";

export interface WordingInput {
  title: string;
  /** Summary and description as one plain-text body. */
  text: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  weight?: { value?: number; unit?: string } | null;
  colour?: string | null;
  deliveryLeadTime?: string | null;
  /** Labelled specifications harvested from the supplier's own page. */
  extra?: Record<string, string> | null;
}

/** Sentences, keeping enough of each to quote in a report. */
function sentencesOf(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Words taking "an" despite starting with a consonant letter, and the reverse.
 *
 * English article choice follows sound, not spelling, so a letter test alone
 * reports "an hour" and misses "a hour". Only the cases that actually recur in
 * product copy are listed; anything not listed is judged on its first letter.
 */
const AN_DESPITE_CONSONANT =
  /^(?:hour|honest|honour|heir|mdf|led|rgb|s|f|h|l|m|n|r|x)/i;
const A_DESPITE_VOWEL = /^(?:uni|use|useful|user|one|once|euro|ubiquit)/i;

function articleFaults(text: string): WordingFault[] {
  const faults: WordingFault[] = [];
  const pattern = /\b(a|an)\s+([a-z0-9-]+)/gi;
  for (const match of text.matchAll(pattern)) {
    const article = match[1]!.toLowerCase();
    const word = match[2]!;
    const startsVowel = /^[aeiou]/i.test(word);
    const wantsAn = startsVowel
      ? !A_DESPITE_VOWEL.test(word)
      : AN_DESPITE_CONSONANT.test(word) &&
        /^(?:hour|honest|honour|heir)/i.test(word);
    const wantsA = !wantsAn;
    if (article === "a" && wantsAn)
      faults.push({
        check: "article-disagreement",
        message: `"a ${word}" should be "an ${word}".`,
        context: match[0]!,
      });
    if (article === "an" && wantsA)
      faults.push({
        check: "article-disagreement",
        message: `"an ${word}" should be "a ${word}".`,
        context: match[0]!,
      });
  }
  return faults;
}

/** Words repeated back to back, within a single sentence only. */
function repeatedWordFaults(text: string): WordingFault[] {
  const faults: WordingFault[] = [];
  for (const sentence of sentencesOf(text)) {
    // Bounded to one sentence because a heading "Care and Cleaning" above a
    // paragraph "Cleaning the vase is simple" is not a repeated word. That
    // exact mistake produced 152 false findings earlier in this project.
    const match = /\b([a-z]{2,})\s+\1\b/i.exec(sentence);
    // "had had" and "that that" are correct English; everything else doubled
    // is a typo. Two letters rather than three, because "in in" and "to to"
    // are exactly the slips this is for.
    if (match && !/^(?:had|that)$/i.test(match[1]!))
      faults.push({
        check: "repeated-word",
        message: `"${match[1]}" is repeated.`,
        context: sentence,
      });
  }
  return faults;
}

const PLACEHOLDERS = [
  "tbc",
  "tbd",
  "to be confirmed",
  "to be advised",
  "lorem ipsum",
  "insert text",
  "xxx",
  "placeholder",
  "coming soon",
  "n/a",
  "null",
  "undefined",
];

function placeholderFaults(text: string): WordingFault[] {
  const faults: WordingFault[] = [];
  const lower = text.toLowerCase();
  for (const placeholder of PLACEHOLDERS) {
    const at = new RegExp(
      `(?<![a-z])${placeholder.replace("/", "\\/")}(?![a-z])`,
    ).exec(lower);
    if (!at) continue;
    const sentence =
      sentencesOf(text).find((s) => s.toLowerCase().includes(placeholder)) ??
      text.slice(0, 120);
    faults.push({
      check: "placeholder-left-in",
      message: `"${placeholder}" left in the copy.`,
      context: sentence,
    });
  }
  return faults;
}

/** Numbers with a unit, as written. */
function measurementsIn(text: string) {
  return [...text.matchAll(/(\d+(?:\.\d+)?)\s*(mm|cm|m|kg|g)\b/gi)].map(
    (m) => ({
      value: Number(m[1]),
      unit: m[2]!.toLowerCase(),
      raw: m[0]!,
    }),
  );
}

function mixedUnitFaults(text: string): WordingFault[] {
  const units = new Set(
    measurementsIn(text)
      .filter((m) => m.unit === "mm" || m.unit === "cm")
      .map((m) => m.unit),
  );
  if (units.size < 2) return [];
  return [
    {
      check: "mixed-units",
      message: "Measurements given in both mm and cm on the same page.",
      context: measurementsIn(text)
        .filter((m) => m.unit === "mm" || m.unit === "cm")
        .map((m) => m.raw)
        .join(", "),
    },
  ];
}

/**
 * Lengths in the prose that match none of the recorded dimensions.
 *
 * Only fires when we hold dimensions to compare against, and ignores small
 * numbers: a "2cm lip" or a "5cm base" is a detail of the product that our
 * three recorded dimensions would not carry, and flagging those would bury the
 * real cases where the copy says 180cm and the record says 160cm.
 */
function dimensionFaults(input: WordingInput): WordingFault[] {
  const d = input.dimensions;
  const recorded = [d?.length, d?.width, d?.height].filter(
    (n): n is number => typeof n === "number" && n > 0,
  );
  if (recorded.length === 0) return [];
  const unit = (d?.unit ?? "cm").toLowerCase();
  const faults: WordingFault[] = [];
  const seen = new Set<number>();
  for (const measurement of measurementsIn(input.text)) {
    if (measurement.unit !== unit) continue;
    if (measurement.value < 40) continue;
    // Advice about where to hang something is not a claim about its size.
    // "About 145cm from the floor is the gallery convention" was reported as
    // contradicting an 8cm bauble.
    const inSentence =
      sentencesOf(input.text).find((s) => s.includes(measurement.raw)) ?? "";
    if (
      /\b(from the floor|convention|eye level|centre line|hang|hung)\b/i.test(
        inSentence,
      )
    )
      continue;
    if (seen.has(measurement.value)) continue;
    // Diameters, diagonals and totals are legitimately derived, so allow any
    // recorded figure, their sum, and a 2% tolerance for rounding.
    const allowed = [...recorded, recorded.reduce((a, b) => a + b, 0)];
    if (
      allowed.some(
        (r) => Math.abs(r - measurement.value) <= Math.max(1, r * 0.02),
      )
    )
      continue;
    seen.add(measurement.value);
    faults.push({
      check: "dimension-contradiction",
      message: `Copy says ${measurement.raw}, but the recorded dimensions are ${recorded.join(" × ")}${unit}.`,
      context:
        sentencesOf(input.text).find((s) => s.includes(measurement.raw)) ??
        measurement.raw,
    });
  }
  return faults;
}

const COLOUR_WORDS = [
  "black",
  "white",
  "grey",
  "gray",
  "cream",
  "beige",
  "brown",
  "natural",
  "oak",
  "walnut",
  "green",
  "blue",
  "red",
  "pink",
  "gold",
  "silver",
  "bronze",
  "brass",
  "copper",
  "charcoal",
  "navy",
  "teal",
  "terracotta",
];

/** Colours that are ordinarily the same thing, so not a contradiction. */
const COLOUR_SYNONYMS: Record<string, string[]> = {
  grey: ["gray", "charcoal", "silver"],
  gray: ["grey", "charcoal", "silver"],
  cream: ["white", "beige", "natural"],
  white: ["cream"],
  beige: ["cream", "natural", "brown"],
  natural: ["oak", "brown", "beige", "cream"],
  oak: ["natural", "brown"],
  walnut: ["brown"],
  brown: ["natural", "walnut", "oak", "beige"],
  gold: ["brass", "bronze", "copper"],
  brass: ["gold", "bronze"],
  bronze: ["gold", "brass", "copper"],
  silver: ["grey", "gray"],
  charcoal: ["grey", "gray", "black"],
  black: ["charcoal"],
  navy: ["blue"],
  blue: ["navy", "teal"],
};

/**
 * A colour claimed in the prose that the product is not.
 *
 * Compared against the colour in the title as well as the recorded field,
 * because the title is the stronger signal — "Dark Grey" in the name is not
 * negotiable — and because it means the check works on products where the
 * colour field was never filled in.
 */
function colourFaults(input: WordingInput): WordingFault[] {
  const known = new Set<string>();
  const haystack = `${input.title} ${input.colour ?? ""}`.toLowerCase();
  for (const colour of COLOUR_WORDS)
    if (new RegExp(`(?<![a-z])${colour}(?![a-z])`).test(haystack))
      known.add(colour);
  if (known.size === 0) return [];

  const allowed = new Set(known);
  for (const colour of known)
    for (const synonym of COLOUR_SYNONYMS[colour] ?? []) allowed.add(synonym);

  const faults: WordingFault[] = [];
  const seen = new Set<string>();
  for (const sentence of sentencesOf(input.text)) {
    const lower = sentence.toLowerCase();
    for (const colour of COLOUR_WORDS) {
      if (allowed.has(colour) || seen.has(colour)) continue;
      if (!new RegExp(`(?<![a-z])${colour}(?![a-z])`).test(lower)) continue;
      // A colour named as something to pair *with* is advice, not a claim
      // about the product, and pairing advice is most of what our copy does.
      if (
        /\b(pair|pairs|pairing|alongside|against|beside|combine|style|styling|complement|contrast|accent|works with|next to)\b/i.test(
          sentence,
        )
      )
        continue;
      // A bulleted list item — "Terracotta", "Aged brass or copper lanterns" —
      // arrives here as a sentence of its own, stripped of the "Pair it with:"
      // line above it. Flagging those reported a black barbecue as claiming to
      // be brass, copper and terracotta at once. A short fragment that does not
      // end in a full stop is a list item, not a claim about the product.
      const trimmed = sentence.trim();
      if (!/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length <= 8) continue;
      // A glossary line — "Walnut — Darker and richer, for schemes that want
      // more depth." — names a material and explains it. It is the clearest
      // possible case of pairing advice, and it ends in a full stop, so the
      // fragment test above does not catch it.
      if (/^[A-Z][A-Za-z\s]{2,30}\s[—–-]\s/.test(trimmed)) continue;
      seen.add(colour);
      faults.push({
        check: "colour-contradiction",
        message: `Copy calls it ${colour}, but the product is ${[...known].join("/")}.`,
        context: sentence,
      });
    }
  }
  return faults;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
};

/**
 * A piece or seat count in the copy that disagrees with the title's.
 *
 * "5-Piece Garden Sofa Set" described as a four-piece set is the kind of error
 * that generates a return, and it is entirely checkable.
 */
function quantityFaults(input: WordingInput): WordingFault[] {
  const titleMatch =
    /(\d+)\s*[- ]?\s*(piece|seater|seat|drawer|tier|pack|person)/i.exec(
      input.title,
    );
  if (!titleMatch) return [];
  const expected = Number(titleMatch[1]);
  const noun = titleMatch[2]!.toLowerCase();
  const faults: WordingFault[] = [];
  for (const sentence of sentencesOf(input.text)) {
    const pattern = new RegExp(
      `(\\d+|${Object.keys(NUMBER_WORDS).join("|")})\\s*[- ]?\\s*${noun}s?\\b`,
      "i",
    );
    const found = pattern.exec(sentence);
    if (!found) continue;
    const raw = found[1]!.toLowerCase();
    const stated = NUMBER_WORDS[raw] ?? Number(raw);
    if (!Number.isFinite(stated) || stated === expected) continue;
    faults.push({
      check: "quantity-contradiction",
      message: `Title says ${expected} ${noun}, copy says ${stated}.`,
      context: sentence,
    });
    break;
  }
  return faults;
}

/** A delivery time in the copy that is not the recorded lead time. */
function leadTimeFaults(input: WordingInput): WordingFault[] {
  const recorded = input.deliveryLeadTime?.trim();
  if (!recorded) return [];
  const faults: WordingFault[] = [];
  const pattern =
    /(\d+\s*(?:-|to|–)\s*\d+|\d+)\s*(working\s+)?(day|days|week|weeks)\b/gi;
  const seen = new Set<string>();
  for (const sentence of sentencesOf(input.text)) {
    if (
      !/\b(deliver|delivery|dispatch|despatch|arrive|arrival|ship)/i.test(
        sentence,
      )
    )
      continue;
    for (const match of sentence.matchAll(pattern)) {
      const stated = match[0]!.replace(/\s+/g, " ").trim();
      const normalise = (s: string) =>
        s
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[–—]/g, "-")
          .replace(/to/g, "-");
      if (normalise(recorded).includes(normalise(stated))) continue;
      if (seen.has(stated)) continue;
      seen.add(stated);
      faults.push({
        check: "lead-time-contradiction",
        message: `Copy says ${stated}, recorded lead time is "${recorded}".`,
        context: sentence,
      });
    }
  }
  return faults;
}

/** Copy that promises no assembly where the supplier says otherwise. */
function assemblyFaults(input: WordingInput): WordingFault[] {
  const spec = input.extra?.["Assembly Required"];
  if (!spec) return [];
  const required = !/^no\b/i.test(spec.trim());
  const faults: WordingFault[] = [];
  for (const sentence of sentencesOf(input.text)) {
    const saysNone =
      /\b(no assembly|fully assembled|arrives assembled|ready to use straight|requires no assembly|no tools)\b/i.test(
        sentence,
      );
    const saysSome =
      /\b(assembly is required|requires assembly|self-assembly|flat[- ]pack)\b/i.test(
        sentence,
      );
    if (required && saysNone)
      faults.push({
        check: "assembly-contradiction",
        message: `Copy says no assembly, but the supplier records "${spec}".`,
        context: sentence,
      });
    if (!required && saysSome)
      faults.push({
        check: "assembly-contradiction",
        message: `Copy says assembly is required, but the supplier records "${spec}".`,
        context: sentence,
      });
  }
  return faults;
}

/**
 * The product's own shipping weight offered as a load capacity.
 *
 * This exact mistake was made three times by hand on this project: "How much
 * weight can the chest hold?" answered with the 50kg the chest itself weighs.
 * A shopper who loads 50kg onto something rated for far less is the reason it
 * matters.
 */
function capacityFaults(input: WordingInput): WordingFault[] {
  const own = input.weight?.value;
  if (typeof own !== "number" || own <= 0) return [];
  const unit = (input.weight?.unit ?? "kg").toLowerCase();
  const faults: WordingFault[] = [];
  for (const sentence of sentencesOf(input.text)) {
    if (
      !/\b(hold|holds|holding|support|supports|capacity|take|takes|load|bear|bears|up to|maximum|max)\b/i.test(
        sentence,
      )
    )
      continue;
    const pattern = new RegExp(`(?<![\\d.])${own}\\s*${unit}\\b`, "i");
    if (!pattern.test(sentence)) continue;
    // "weighs 50kg" in the same sentence means the figure is being used
    // correctly, as the product's own mass.
    if (/\b(weighs|weight of|shipping weight|product weight)\b/i.test(sentence))
      continue;
    faults.push({
      check: "weight-as-capacity",
      message: `Offers ${own}${unit} as a capacity, which is the product's own weight.`,
      context: sentence,
    });
  }
  return faults;
}

/** Typographic slips with no innocent reading. */
function typographyFaults(text: string): WordingFault[] {
  const faults: WordingFault[] = [];
  const spaceBefore = /\s+([,.;:!?])/.exec(text);
  if (spaceBefore)
    faults.push({
      check: "spacing-before-punctuation",
      message: `Space before "${spaceBefore[1]}".`,
      context: text
        .slice(Math.max(0, spaceBefore.index - 40), spaceBefore.index + 20)
        .trim(),
    });

  // Ellipses and "?!" are deliberate; a doubled comma or full stop is not.
  const doubled = /([,;:])\1|\.{2}(?!\.)|\?{2}|!{2}/.exec(text);
  if (doubled)
    faults.push({
      check: "doubled-punctuation",
      message: `Doubled punctuation: "${doubled[0]}".`,
      context: text
        .slice(Math.max(0, doubled.index - 40), doubled.index + 20)
        .trim(),
    });

  const opens = (text.match(/\(/g) ?? []).length;
  const closes = (text.match(/\)/g) ?? []).length;
  if (opens !== closes)
    faults.push({
      check: "unbalanced-brackets",
      message: `${opens} "(" against ${closes} ")".`,
      context:
        sentencesOf(text).find((s) => s.includes("(") !== s.includes(")")) ??
        "",
    });

  for (const sentence of sentencesOf(text)) {
    // A sentence opening lower case, where the previous one ended properly.
    // Skipped for fragments that are plainly list items or measurements.
    if (!/^[a-z]/.test(sentence)) continue;
    if (/^\d/.test(sentence) || sentence.length < 12) continue;
    if (!/[.!?]$/.test(sentence)) continue;
    faults.push({
      check: "sentence-starts-lowercase",
      message: "Sentence begins in lower case.",
      context: sentence,
    });
    break;
  }
  return faults;
}

/** Every wording fault in one product. */
export function wordingFaults(input: WordingInput): WordingFault[] {
  if (!input.text.trim()) return [];
  return [
    ...articleFaults(input.text),
    ...repeatedWordFaults(input.text),
    ...placeholderFaults(input.text),
    ...mixedUnitFaults(input.text),
    ...dimensionFaults(input),
    ...colourFaults(input),
    ...quantityFaults(input),
    ...leadTimeFaults(input),
    ...assemblyFaults(input),
    ...capacityFaults(input),
    ...typographyFaults(input.text),
  ];
}
