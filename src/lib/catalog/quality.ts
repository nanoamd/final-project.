/**
 * Scores a product's page against the Kaiku standard.
 *
 * Written for the catalogue quality audit of 20 August 2026, after the
 * catalogue was found to have drifted: the earliest products are dense with
 * verifiable detail, and the later ones are two to four times longer while
 * saying materially less.
 *
 * **The central measure is fact density, not length.** A 340-word teak shelf
 * listing carrying 2.06 facts per hundred words tells a buyer more than a
 * 1,633-word mirror listing carrying none, and the catalogue contains both.
 * Every heuristic here is built to reward the first and catch the second, which
 * is the opposite of what a word-count target would do.
 *
 * Pure by design — no Sanity client, no server imports — so the offline audit
 * script and the live admin readiness screen score a product identically. A
 * report that disagreed with the screen it links to would be worse than no
 * report.
 */

/** A single thing wrong with a product, in the words we would use to fix it. */
export interface Finding {
  /** Which of the ten audit dimensions this counts against. */
  dimension: Dimension;
  /** `blocker` keeps a product out of GOLD/SILVER entirely. */
  severity: "blocker" | "major" | "minor";
  message: string;
}

export type Dimension =
  | "accuracy"
  | "usefulness"
  | "humanQuality"
  | "brandFit"
  | "specificity"
  | "seo"
  | "commercial"
  | "returnRisk"
  | "readability"
  | "aiRisk";

export const DIMENSIONS: Dimension[] = [
  "accuracy",
  "usefulness",
  "humanQuality",
  "brandFit",
  "specificity",
  "seo",
  "commercial",
  "returnRisk",
  "readability",
  "aiRisk",
];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  accuracy: "Accuracy",
  usefulness: "Usefulness",
  humanQuality: "Human quality",
  brandFit: "Brand fit",
  specificity: "Specificity",
  seo: "SEO",
  commercial: "Commercial",
  returnRisk: "Return risk",
  readability: "Readability",
  aiRisk: "AI-pattern risk",
};

/**
 * A specification value that tells a buyer nothing.
 *
 * Two kinds, both found live. An outright placeholder — "To be confirmed",
 * "Not specified" — is a note-to-self published on the product page, in the
 * table a buyer opens precisely to find facts. A weasel value — "High-Quality
 * Wood", "Neutral Finish", "Standard size" — looks like an answer and is not
 * one: it names no wood, no colour and no measurement.
 */
export const PLACEHOLDER_SPEC =
  /^(?:to be confirmed|tbc|tba|n\/?a|not specified|not stated|unknown|various|assorted|standard|as shown|see description|please enquire|contact us.*)$/i;

export const WEASEL_SPEC =
  /\b(?:high[- ]quality|premium|luxury|superior|top[- ]grade|quality|durable) (?:wood|glass|metal|material|materials|finish|fabric)\b|^(?:neutral|standard)(?: finish| size| bulb)?$/i;

/** What the scorer needs to know about a product. All of it optional but title. */
export interface QualityInput {
  title: string;
  slug?: string | null;
  summary?: string | null;
  /** The description flattened to plain text, headings included. */
  descriptionText?: string | null;
  /** The description's h2/h3 headings, in order. */
  headings?: string[];
  /** Whether the SKU matches the house format, so identity scores too. */
  skuIsCanonical?: boolean;
  faqs?: { question?: string | null; answer?: string | null }[] | null;
  price?: number | null;
  costPrice?: number | null;
  shippingCost?: number | null;
  sku?: string | null;
  supplierSku?: string | null;
  gtin?: string | null;
  supplier?: string | null;
  category?: string | null;
  dimensions?: unknown;
  weight?: unknown;
  stockStatus?: string | null;
  galleryCount?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  /** The label/value rows shown in the Specifications tab. */
  specs?: { label?: string | null; value?: string | null }[] | null;
  published?: boolean;
}

export type Grade = "A" | "B" | "C" | "D" | "E";
export type Tier = "GOLD" | "SILVER" | "REVIEW";

export interface QualityResult {
  scores: Record<Dimension, number>;
  /** Mean of the ten dimensions, 0–10. */
  overall: number;
  grade: Grade;
  tier: Tier;
  findings: Finding[];
  stats: {
    words: number;
    facts: number;
    factsPer100: number;
    aiPhrases: string[];
    /** Fraction of the summary's opening that repeats in the description. */
    summaryEchoesDescription: boolean;
  };
}

/**
 * A number carrying a unit — the atom of a useful product description.
 *
 * The separator class allows a hyphen because "6-Person" and "3-Tier" are how
 * these facts are actually written in the catalogue; an earlier version of this
 * regex required a space and scored the SaunaPlunge barrel saunas at zero.
 */
export const FACT_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:-\s*)?(?:mm|cm|metres?|metre|m\b|kg|grams?|g\b|kW|W\b|watts?|V\b|volts?|amps?|°C|°|litres?|ltr|l\b|hours?|hrs?|years?|months?|weeks?|days?|person|people|seater|tier|drawer|shelf|shelves|pack|piece|set|inch|in\b|ft\b|")/gi;

/**
 * Phrases that mark copy as machine-written filler.
 *
 * Taken from the brief, then extended with the phrases the catalogue actually
 * over-uses — "seamlessly" appears in 536 documents, "perfect for" in 617.
 * Matched on word boundaries so "elevate" does not fire inside "elevated
 * platform", which is a legitimate description of a sauna base.
 */
export const AI_PHRASES = [
  "elevate your",
  "elevate any",
  "effortlessly",
  "seamlessly",
  "timeless elegance",
  "luxurious touch",
  "beautifully crafted",
  "transform your",
  "perfect for",
  "whether you",
  "designed to enhance",
  "adds a touch of",
  "touch of magic",
  "touch of sophistication",
  "statement piece",
  "must-have",
  "versatile addition",
  "any space",
  "your space",
  "captivating",
  "enchanting",
  "exquisite",
  "stands the test of time",
  "stunning piece",
  "wonderful addition",
  "focal point in any",
  "no matter the occasion",
  "for every occasion",
  "sure to impress",
];

/**
 * Headings so widely reused that they carry no information about the product.
 * A product whose every heading is on this list has a template, not a page.
 */
const TEMPLATE_HEADINGS = new Set(
  [
    "features",
    "specifications",
    "care & maintenance",
    "care and maintenance",
    "delivery",
    "returns",
    "delivery & returns",
    "dimensions",
    "overview",
    "description",
    "product details",
    "key features",
  ].map((h) => h.toLowerCase()),
);

/** An FAQ answer that admits it has nothing to say is worse than no FAQ. */
const EMPTY_ANSWER_PATTERN =
  /\b(?:not specified|no(?:t)? (?:available|provided|listed|stated)|unavailable|please contact|refer to the (?:supplier|manufacturer)|information is not)\b/i;

/**
 * Artefacts of the machinery that produced the copy, rather than faults in the
 * copy itself. Every one was found in the live catalogue on 20 August 2026 —
 * none is hypothetical.
 *
 * Severity is meant literally: serialisation garbage is a blocker because a
 * customer is reading raw template syntax on a live page, whereas a doubled
 * space is a blemish.
 */
const ARTEFACTS: {
  dimension: Dimension;
  severity: Finding["severity"];
  pattern: RegExp;
  message: string;
}[] = [
  {
    dimension: "accuracy",
    severity: "blocker",
    // "}},{ heading Delivery paragraphs :[" — the generator's own scaffolding.
    pattern: /[{}]|\bparagraphs\b\s*[:[]|(?:,\s*){3,}|\/g\s*,/,
    message: "Raw template syntax is visible in the copy.",
  },
  {
    dimension: "readability",
    severity: "major",
    // Bold, links, and — the one this originally missed — list markers.
    // "The dining table measures: * Length: 180 cm * Width: 77 cm" was
    // rendering the asterisks literally on eleven published product pages.
    pattern: /\*\*|\[[^\]]+\]\([^)]+\)|(?:^|\s)\*\s+\w|(?:^|\s)#{1,4}\s+\w/,
    message: "Markdown markup left in the text.",
  },
  {
    dimension: "readability",
    severity: "major",
    pattern: /&(?:amp|nbsp|quot|lt|gt|#\d+);|<\/?[a-z]+>/i,
    message: "An HTML entity or tag is showing as literal text.",
  },
  {
    dimension: "humanQuality",
    severity: "major",
    pattern:
      /\b(?:as an ai|i'm sorry|i cannot|certainly!|here(?:'s| is) (?:a|the) (?:list|description|overview))/i,
    message: "Chatbot phrasing left in the copy.",
  },
  {
    dimension: "usefulness",
    severity: "major",
    pattern: /\bnot specified\b|\bnot stated\b|\bnot provided\b|\bN\/A\b/i,
    message:
      "The copy admits it does not know something instead of finding it out.",
  },
  {
    dimension: "brandFit",
    severity: "major",
    pattern: /\bthe supplier\b|\baccording to the (?:supplier|manufacturer)\b/i,
    message:
      "Quotes \u201Cthe supplier\u201D rather than stating the fact as Kaiku's own.",
  },
  {
    dimension: "usefulness",
    severity: "major",
    pattern: /\b(?:refer to|check|see) the product page\b/i,
    message: "Tells the reader to check the product page they are already on.",
  },
  {
    dimension: "accuracy",
    severity: "blocker",
    // "delivery within 7-14 days for orders under £50". The threshold is real,
    // but it is one of Kaiku's internal rules — same family as a supplier code
    // or a trade pack size. A customer pays £0 carriage on everything, so
    // publishing the rule invites them to infer a tier that does not apply to
    // them.
    pattern: /(?:under|over|above|below)\s*\u00A3\s?\d/i,
    message:
      "Publishes an internal value threshold. That rule is ours, not the customer's.",
  },
  {
    dimension: "readability",
    severity: "minor",
    // Spaces and tabs only, never a newline. Headings are flattened into the
    // same text stream as the paragraph beneath them, so a heading "Care and
    // Cleaning" followed by "Cleaning the vase is simple" is not a repeated
    // word — it is two blocks, and matching across the break invented 108
    // findings that were not real.
    pattern: /\b(\w{4,})[ \t]+\1\b/i,
    message: "A word is repeated back to back.",
  },
  {
    dimension: "readability",
    severity: "minor",
    pattern: /[a-z][ \t]{2,}[a-z]/i,
    message: "Doubled spacing inside a sentence.",
  },
];

/** Words that a supplier's own copy leaves behind. See Step 15 of the brief. */
const SUPPLIER_LEAK_PATTERN =
  /\b(?:d\.?i\.?\s*designs|hill interiors|premier housewares|aosom|outsunny|didesigns|https?:\/\/|www\.)/i;

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n));
}

/** Rounds to one decimal and never returns `-0`, which reads as a bug. */
function round1(n: number): number {
  const r = Math.round(n * 10) / 10;
  return r === 0 ? 0 : r;
}

function wordsIn(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function sentencesIn(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function scoreProduct(input: QualityInput): QualityResult {
  const findings: Finding[] = [];
  const add = (
    dimension: Dimension,
    severity: Finding["severity"],
    message: string,
  ) => findings.push({ dimension, severity, message });

  const description = (input.descriptionText ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const body = `${summary}\n${description}`.trim();
  const lower = body.toLowerCase();
  // Facts and words are both counted over `body`, so the density is a ratio of
  // two measurements of the same text. Counting facts across summary and
  // description but words across the description alone inflated every score.
  const words = wordsIn(body);
  const facts = (body.match(FACT_PATTERN) ?? []).length;
  const factsPer100 = words > 0 ? (100 * facts) / words : 0;
  const headings = input.headings ?? [];

  // --- Specificity ------------------------------------------------------
  // The load-bearing dimension. 1.0 facts per 100 words is roughly the level
  // the best of the early catalogue reaches; 0 is a page that describes a mood.
  let specificity = clamp(factsPer100 * 6);
  if (words === 0) {
    specificity = 0;
    add("specificity", "blocker", "No description at all.");
  } else if (facts === 0) {
    add(
      "specificity",
      "blocker",
      `${words} words and not one measurement, material weight or capacity. A buyer learns nothing they could act on.`,
    );
  } else if (factsPer100 < 0.4) {
    add(
      "specificity",
      "major",
      `Only ${facts} concrete fact${facts === 1 ? "" : "s"} across ${words} words.`,
    );
  }

  // --- AI-pattern risk --------------------------------------------------
  const aiPhrases = AI_PHRASES.filter((p) => lower.includes(p));
  // Judged against an allowance rather than a raw count or a flat density.
  // One "perfect for" in a long factual page is a turn of phrase and costs
  // nothing; eight in three hundred words is a generator. The allowance grows
  // with length — roughly one tolerated phrase per 250 words, never below one —
  // so a thorough page is not punished for being thorough.
  const aiAllowance = Math.max(1, words / 250);
  const aiExcess = Math.max(0, aiPhrases.length - aiAllowance);
  const aiRisk = clamp(10 - aiExcess * 2.2);
  if (aiPhrases.length >= 6) {
    add(
      "aiRisk",
      "major",
      `${aiPhrases.length} filler phrases: ${aiPhrases.slice(0, 5).join(", ")}${aiPhrases.length > 5 ? "…" : ""}`,
    );
  } else if (aiPhrases.length >= 3) {
    add("aiRisk", "minor", `Filler phrases: ${aiPhrases.join(", ")}`);
  }

  // --- Human quality ----------------------------------------------------
  // Template structure, and length used as a substitute for substance.
  let humanQuality = 10;
  const bespokeHeadings = headings.filter(
    (h) => !TEMPLATE_HEADINGS.has(h.trim().toLowerCase()),
  );
  if (headings.length > 0 && bespokeHeadings.length === 0) {
    humanQuality -= 3;
    add(
      "humanQuality",
      "major",
      "Every heading is a generic template heading.",
    );
  }
  if (words > 900 && factsPer100 < 0.5) {
    humanQuality -= 4;
    add(
      "humanQuality",
      "major",
      `${words} words carrying ${facts} facts — length standing in for substance.`,
    );
  } else if (words > 2000) {
    // Length alone is not a fault here. Kaiku's house style is the long,
    // fully-explained page — the Sorelle Two Seater Sofa runs to 1,628 words
    // and is the benchmark Damien pointed at — so the threshold sits above it.
    // Padding is still caught, by the facts-per-100-words rule above: a long
    // page carrying real measurements passes, a long page carrying none does
    // not. This only fires where a page has gone past any plausible reading.
    humanQuality -= 2;
    add(
      "humanQuality",
      "minor",
      `${words} words is longer than it needs to be.`,
    );
  }
  humanQuality = clamp(humanQuality - aiExcess * 0.8);

  // --- Usefulness -------------------------------------------------------
  let usefulness = 10;
  if (words === 0) {
    usefulness = 0;
  } else {
    if (words < 80) {
      usefulness -= 4;
      add(
        "usefulness",
        "major",
        `Only ${words} words — too thin to decide on.`,
      );
    }
    if (!input.dimensions) {
      usefulness -= 2;
      add(
        "usefulness",
        "major",
        "No dimensions recorded — the single most common pre-purchase question.",
      );
    }
    if (!input.galleryCount) {
      usefulness -= 3;
      add("usefulness", "blocker", "No images.");
    }
  }
  usefulness = clamp(usefulness);

  // --- Accuracy ---------------------------------------------------------
  let accuracy = 10;
  const emptyFaqs = (input.faqs ?? []).filter((f) =>
    EMPTY_ANSWER_PATTERN.test(f?.answer ?? ""),
  );
  if (emptyFaqs.length > 0) {
    accuracy -= 3;
    add(
      "accuracy",
      "major",
      `${emptyFaqs.length} FAQ${emptyFaqs.length === 1 ? "" : "s"} answer nothing (e.g. "${(emptyFaqs[0]?.question ?? "").slice(0, 60)}").`,
    );
  }
  // Checked across summary, description, FAQs and meta together. An earlier
  // version looked only at the description, and therefore missed 15 summaries
  // naming a supplier plus every leak sitting inside an FAQ answer.
  const everyField = [
    summary,
    description,
    (input.faqs ?? [])
      .map((f) => `${f?.question ?? ""} ${f?.answer ?? ""}`)
      .join("\n"),
    input.seoTitle ?? "",
    input.seoDescription ?? "",
  ].join("\n");

  if (SUPPLIER_LEAK_PATTERN.test(everyField)) {
    accuracy -= 3;
    add(
      "accuracy",
      "major",
      "Supplier name or link left in customer-facing copy.",
    );
  }
  accuracy = clamp(accuracy);

  // --- Brand fit --------------------------------------------------------
  let brandFit = 10;
  if (!input.title.trim().endsWith("| Kaiku")) {
    brandFit -= 3;
    add("brandFit", "major", "Title does not end with “| Kaiku”.");
  }
  if (/\b(?:SALE|CHEAP|BARGAIN|!!+)\b/.test(input.title)) {
    brandFit -= 4;
    add("brandFit", "major", "Discount-shop language in the title.");
  }
  brandFit = clamp(brandFit - aiExcess * 0.6);

  // --- SEO --------------------------------------------------------------
  let seo = 10;
  if (!input.seoTitle) {
    seo -= 2;
    add("seo", "minor", "No meta title.");
  }
  if (!input.seoDescription) {
    seo -= 3;
    add("seo", "major", "No meta description.");
  } else if (input.seoDescription.length > 160) {
    seo -= 1;
    add(
      "seo",
      "minor",
      `Meta description is ${input.seoDescription.length} characters — Google truncates around 160.`,
    );
  }
  if (!input.slug) {
    seo -= 3;
    add("seo", "blocker", "No slug, so the product has no URL.");
  }
  seo = clamp(seo);

  // --- Commercial -------------------------------------------------------
  let commercial = 10;
  const price = input.price ?? null;
  const cost = input.costPrice ?? null;
  if (price == null || price <= 0) {
    commercial -= 5;
    add("commercial", "blocker", "No retail price.");
  }
  if (cost == null || cost <= 0) {
    commercial -= 3;
    add("commercial", "major", "No cost price, so margin is unknown.");
  }
  if (price != null && cost != null && price > 0 && cost > 0) {
    const carriage = input.shippingCost ?? 0;
    const margin = (price - cost - carriage) / price;
    if (margin < 0) {
      commercial -= 6;
      add(
        "commercial",
        "blocker",
        `Loss-making: sells at £${price}, costs £${cost}${carriage ? ` plus £${carriage} carriage` : ""}.`,
      );
    } else if (margin < 0.1) {
      commercial -= 3;
      add(
        "commercial",
        "major",
        `Margin is only ${Math.round(margin * 100)}%.`,
      );
    }
    if (input.shippingCost == null) {
      commercial -= 2;
      add(
        "commercial",
        "major",
        "No carriage cost recorded, so the margin above is optimistic.",
      );
    }
  }
  if (!input.supplierSku) {
    commercial -= 2;
    add(
      "commercial",
      "major",
      "No supplier SKU — cannot be ordered or matched to a supplier feed.",
    );
  }
  if (!input.supplier) {
    commercial -= 3;
    add("commercial", "blocker", "No supplier.");
  }
  commercial = clamp(commercial);

  // --- Return risk ------------------------------------------------------
  // What a customer could misunderstand, per Step 13 of the brief.
  let returnRisk = 10;
  if (!input.dimensions) {
    returnRisk -= 4;
    add(
      "returnRisk",
      "major",
      "No dimensions — the most common cause of “not what I expected”.",
    );
  }
  if (!input.weight) {
    returnRisk -= 1;
    add("returnRisk", "minor", "No weight recorded.");
  }
  if ((input.galleryCount ?? 0) < 2) {
    returnRisk -= 2;
    add(
      "returnRisk",
      "minor",
      `Only ${input.galleryCount ?? 0} image${input.galleryCount === 1 ? "" : "s"} — one angle invites a surprise.`,
    );
  }
  returnRisk = clamp(returnRisk);

  // --- Readability ------------------------------------------------------
  let readability = 10;
  const sentences = sentencesIn(description);
  if (sentences.length >= 4) {
    const lengths = sentences.map(wordsIn);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
    const stdev = Math.sqrt(variance);
    // Uniform sentence length is the most reliable tell of generated prose.
    if (stdev < 4) {
      readability -= 3;
      add(
        "readability",
        "minor",
        `Every sentence is about the same length (${Math.round(mean)} words) — reads as generated.`,
      );
    }
    if (mean > 28) {
      readability -= 2;
      add(
        "readability",
        "minor",
        `Sentences average ${Math.round(mean)} words.`,
      );
    }
  }
  readability = clamp(readability);

  // --- Summary / description duplication (Step 14) ----------------------
  const summaryEchoesDescription = echoes(summary, description);
  if (summaryEchoesDescription) {
    usefulness = clamp(usefulness - 2);
    add(
      "usefulness",
      "major",
      "The short summary repeats the description's opening.",
    );
  }
  if (summary.length === 0) {
    usefulness = clamp(usefulness - 1);
    add("usefulness", "minor", "No short summary.");
  }

  // --- Specification rows that say nothing ------------------------------
  const emptySpecs = (input.specs ?? []).filter((spec) =>
    PLACEHOLDER_SPEC.test((spec?.value ?? "").trim()),
  );
  const weaselSpecs = (input.specs ?? []).filter(
    (spec) =>
      !PLACEHOLDER_SPEC.test((spec?.value ?? "").trim()) &&
      WEASEL_SPEC.test((spec?.value ?? "").trim()),
  );
  if (emptySpecs.length > 0) {
    accuracy = clamp(accuracy - 3);
    add(
      "accuracy",
      "major",
      `${emptySpecs.length} specification${emptySpecs.length === 1 ? "" : "s"} published as a placeholder (${emptySpecs
        .slice(0, 2)
        .map((s) => `${s.label}: ${s.value}`)
        .join("; ")}).`,
    );
  }
  if (weaselSpecs.length > 0) {
    usefulness = clamp(usefulness - 2);
    add(
      "usefulness",
      "major",
      `${weaselSpecs.length} specification${weaselSpecs.length === 1 ? "" : "s"} that name nothing (${weaselSpecs
        .slice(0, 2)
        .map((s) => `${s.label}: ${s.value}`)
        .join("; ")}).`,
    );
  }

  // Artefacts, applied across every customer-facing field.
  const artefactPenalty: Partial<Record<Dimension, number>> = {};
  for (const artefact of ARTEFACTS) {
    if (!artefact.pattern.test(everyField)) continue;
    add(artefact.dimension, artefact.severity, artefact.message);
    const cost =
      artefact.severity === "blocker"
        ? 6
        : artefact.severity === "major"
          ? 3
          : 1;
    artefactPenalty[artefact.dimension] =
      (artefactPenalty[artefact.dimension] ?? 0) + cost;
  }
  const less = (dimension: Dimension, value: number) =>
    clamp(value - (artefactPenalty[dimension] ?? 0));

  if (input.skuIsCanonical === false) {
    add("commercial", "major", "SKU is not in the house format.");
    commercial = clamp(commercial - 2);
  }

  const scores: Record<Dimension, number> = {
    accuracy: round1(less("accuracy", accuracy)),
    usefulness: round1(less("usefulness", usefulness)),
    humanQuality: round1(less("humanQuality", humanQuality)),
    brandFit: round1(less("brandFit", brandFit)),
    specificity: round1(specificity),
    seo: round1(seo),
    commercial: round1(commercial),
    returnRisk: round1(returnRisk),
    readability: round1(less("readability", readability)),
    aiRisk: round1(aiRisk),
  };

  const overall = round1(
    DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length,
  );

  return {
    scores,
    overall,
    grade: gradeFor(overall, findings),
    tier: tierFor(overall, findings),
    findings,
    stats: {
      words,
      facts,
      factsPer100: round1(factsPer100),
      aiPhrases,
      summaryEchoesDescription,
    },
  };
}

/**
 * Whether the summary is just the description's opening again.
 *
 * Compares the first twelve words of each rather than the whole strings: a
 * summary that legitimately restates the product's name will share an opening
 * clause, but one that shares twelve consecutive words is the same paragraph
 * pasted twice, which is what Step 14 of the brief forbids.
 */
export function echoes(summary: string, description: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  const a = norm(summary).slice(0, 12);
  const b = norm(description).slice(0, 12);
  if (a.length < 8 || b.length < 8) return false;
  const overlap = a.filter((w, i) => b[i] === w).length;
  return overlap >= 8;
}

function gradeFor(overall: number, findings: Finding[]): Grade {
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  // A blocker is disqualifying regardless of the average: a product with no
  // price and beautiful copy is not a B.
  if (blockers > 0) return overall >= 6 ? "D" : "E";
  if (overall >= 8.5) return "A";
  if (overall >= 7) return "B";
  if (overall >= 5.5) return "C";
  return "D";
}

function tierFor(overall: number, findings: Finding[]): Tier {
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  if (blockers > 0) return "REVIEW";
  const majors = findings.filter((f) => f.severity === "major").length;
  if (overall >= 8.5 && majors === 0) return "GOLD";
  if (overall >= 7) return "SILVER";
  return "REVIEW";
}
