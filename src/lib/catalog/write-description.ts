/**
 * Writes one product description, for one product, from that product's facts.
 *
 * Damien, after a week of template output that read the same on every page:
 *
 *   "can we make a button in sanity that fills what we can specific to the
 *    product? its not sanity thats writing it its you so yes you can make it
 *    specific to what the product is"
 *
 * He is right, and it is the correction to everything before it. A template
 * can be consistent or it can be particular, never both: it recombines the
 * same sentences, so a pergola and a candle holder come out with the same
 * shape and the same phrasing with the nouns swapped. Asking a model to write
 * each page produces something different every time, because it is actually
 * writing rather than filling in slots.
 *
 * What this file holds is everything around that call, which is the part that
 * decides whether the output is any good:
 *
 *   - the facts, so the model has something true to write from;
 *   - the brief, which describes the house voice rather than dictating a
 *     structure, because dictating structure is what produced the sameness;
 *   - the gate, which runs the finished text through every checker the project
 *     has and rejects it if anything fires. A failed draft is sent back with
 *     the specific objections, once. If it fails twice, the objections are
 *     returned instead of the copy — better to say why than to save something
 *     wrong.
 *
 * The network call itself lives in the route. Everything here is pure, so the
 * prompt and the gate can be tested without spending anything.
 */

import { isAdmission } from "./admissions";
import { contextFaults, sitingFor } from "./context-check";
import { resolveDeliveryWindow } from "./delivery";
import { AI_PHRASES, ARTEFACTS } from "./quality";
import { wordingFaults } from "./wording-check";

export interface ProductFacts {
  title: string;
  category?: string | null;
  summary?: string | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  weight?: { value?: number; unit?: string } | null;
  material?: string | null;
  colour?: string | null;
  deliveryLeadTime?: string | null;
  /** Needed to resolve the delivery line — see `resolveDeliveryWindow`. A
   * recorded lead time is only trusted for suppliers with a genuine
   * supplier-confirmed lead time (SaunaPlunge); everyone else gets Kaiku's
   * price-based standard window, the same one the product page's buy-box
   * shows. Without `price` here, the model was told the raw, often-generic
   * imported `deliveryLeadTime` verbatim — which is how a £900 sofa ended up
   * with "dispatched within 7–14 days" in its own description. */
  price?: number | null;
  supplierName?: string | null;
  /** Labelled specifications, from the supplier's own page. */
  specs?: { label?: string | null; value?: string | null }[] | null;
  /** Discrete facts the supplier publishes as a feature list. */
  features?: string[] | null;
}

/** The one delivery answer — price band, unless this supplier's lead time
 * is a genuine confirmed commitment. See `resolveDeliveryWindow`. */
function resolvedDeliveryWindow(facts: ProductFacts): string {
  return resolveDeliveryWindow({
    price: facts.price,
    supplierName: facts.supplierName,
    deliveryLeadTime: facts.deliveryLeadTime,
  });
}

/** One heading and the prose beneath it. */
export interface WrittenSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

/** Everything we actually know, written out for the model to work from. */
export function factSheet(facts: ProductFacts): string {
  const lines: string[] = [`Product name: ${facts.title}`];
  if (facts.category) lines.push(`Category: ${facts.category}`);

  const d = facts.dimensions;
  const unit = d?.unit ?? "cm";
  const sizes = [
    typeof d?.length === "number" && d.length > 0
      ? `depth ${d.length}${unit}`
      : null,
    typeof d?.width === "number" && d.width > 0
      ? `width ${d.width}${unit}`
      : null,
    typeof d?.height === "number" && d.height > 0
      ? `height ${d.height}${unit}`
      : null,
  ].filter(Boolean);
  if (sizes.length) lines.push(`Dimensions: ${sizes.join(", ")}`);

  if (typeof facts.weight?.value === "number" && facts.weight.value > 0)
    lines.push(`Weight: ${facts.weight.value}${facts.weight.unit ?? "kg"}`);
  if (facts.material) lines.push(`Material: ${facts.material}`);
  if (facts.colour) lines.push(`Colour: ${facts.colour}`);
  lines.push(`Dispatch lead time: ${resolvedDeliveryWindow(facts)}`);

  const specs = (facts.specs ?? []).filter((s) => s?.label && s?.value);
  if (specs.length)
    lines.push(
      `Specifications:\n${specs.map((s) => `  - ${s.label}: ${s.value}`).join("\n")}`,
    );

  const features = (facts.features ?? []).filter(
    (f) => f && f.trim().length > 2,
  );
  if (features.length)
    lines.push(
      `Supplier feature list:\n${features.map((f) => `  - ${f}`).join("\n")}`,
    );

  if (facts.summary) lines.push(`Existing summary: ${facts.summary}`);
  return lines.join("\n");
}

/**
 * The brief.
 *
 * Deliberately describes a voice and a set of prohibitions rather than a
 * section list. Every attempt at this that named the sections produced pages
 * that were identical apart from the nouns, which is the fault being fixed.
 */
export function buildPrompt(
  facts: ProductFacts,
  objections?: string[],
): string {
  const retry = objections?.length
    ? `\n\nYour previous attempt was rejected. Fix exactly these and change nothing else:\n${objections.map((o) => `  - ${o}`).join("\n")}\n`
    : "";

  return `You are writing the product page for Kaiku, a UK premium home, garden and wellness shop. Kaiku's positioning is being the most helpful and informative home improvement store on the internet: the page should explain the product thoroughly and tell someone how it would work in their home, while every single fact in it is true.

Write the full description for this one product.

FACTS — these are the only facts you have. Everything you write must be supported by them or be generic advice that is true regardless (styling, care, how to group things, what to consider before buying).

${factSheet(facts)}

HOW TO WRITE IT

Write about THIS product. A candle holder, a pergola and a dining table have almost nothing in common, so their pages should not share a shape. Decide what someone buying this particular thing actually needs to know, and write that. Choose your own headings and your own number of sections based on what this product warrants — a substantial piece of furniture deserves a long page, a small decorative object does not.

Match the length to the substance. If you only have a few facts, write a shorter page rather than padding it. Never write filler to reach a length.

Scale your language to the object. A 15cm planter does not "anchor a room" or need its footprint measured. A 4m pergola genuinely does change a garden. Do not give a small thing importance it does not have.

NEVER DO ANY OF THIS

- Never invent a fact. No material, measurement, capacity, wattage, bulb type, weight limit, certification or country of origin that is not in the facts above.
- Never say a fact is missing. Not "the assembly requirement is not listed", not "refer to the instruction manual", not "contact customer support". If you do not know something, write about something else.
- Never mention the supplier, or say "according to the manufacturer". Facts are stated as Kaiku's own.
- Never write marketing filler: "elevate your space", "effortlessly", "seamlessly", "timeless elegance", "perfect for any home", "statement piece", "must-have", "transform your".
- Never describe an outdoor product as being in a room, or an indoor product as standing on a patio.
- Never name a colour or material for the product other than the ones in the facts. Naming things to pair it WITH is fine and encouraged.
- No markdown, no asterisks, no HTML.

FORMAT

Return JSON only, in this shape:

{
  "sections": [
    { "heading": "string", "paragraphs": ["string"], "bullets": ["string"] }
  ]
}

"bullets" is optional and should be omitted unless a list genuinely helps. Headings are plain sentence-case or title-case text, no numbering.${retry}`;
}

/** A model response, parsed defensively. */
export function parseSections(raw: string): WrittenSection[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const sections = (data as { sections?: unknown })?.sections;
  if (!Array.isArray(sections)) return [];
  return sections
    .map((section) => {
      const s = section as {
        heading?: unknown;
        paragraphs?: unknown;
        bullets?: unknown;
      };
      const heading = typeof s.heading === "string" ? s.heading.trim() : "";
      const paragraphs = Array.isArray(s.paragraphs)
        ? s.paragraphs.filter(
            (p): p is string => typeof p === "string" && p.trim().length > 0,
          )
        : [];
      const bullets = Array.isArray(s.bullets)
        ? s.bullets.filter(
            (b): b is string => typeof b === "string" && b.trim().length > 0,
          )
        : undefined;
      return {
        heading,
        paragraphs,
        bullets: bullets?.length ? bullets : undefined,
      };
    })
    .filter((s) => s.heading && (s.paragraphs.length || s.bullets?.length));
}

/** The written page as plain text, for checking. */
export function sectionsToText(sections: WrittenSection[]): string {
  return sections
    .flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])
    .join("\n");
}

/**
 * Every objection to a written page.
 *
 * One entry means it does not get saved. There is deliberately no severity
 * ranking: the whole point is that it does not need a human to decide which
 * faults are tolerable, because that judgement is what went wrong repeatedly.
 */
export function checkWritten(
  sections: WrittenSection[],
  facts: ProductFacts,
): string[] {
  if (!sections.length) return ["The model returned nothing usable."];
  const text = sectionsToText(sections);
  const found: string[] = [];

  for (const fault of contextFaults(text, sitingFor(facts.category)))
    found.push(
      `It describes the wrong place: "${fault.phrase}" in "${fault.sentence.slice(0, 90)}"`,
    );

  for (const fault of wordingFaults({
    title: facts.title,
    text,
    dimensions: facts.dimensions,
    weight: facts.weight,
    colour: facts.colour,
    deliveryLeadTime: resolvedDeliveryWindow(facts),
    extra: Object.fromEntries(
      (facts.specs ?? [])
        .filter((s) => s?.label && s?.value)
        .map((s) => [s.label as string, s.value as string]),
    ),
  }))
    found.push(`${fault.check}: ${fault.message}`);

  for (const artefact of ARTEFACTS)
    if (artefact.pattern.test(text)) found.push(artefact.message);

  // Filler lives in the scorer rather than the artefact list, so checking the
  // artefacts alone let "effortlessly elevate your space" through. There is no
  // allowance here: the scorer tolerates one phrase in a long page because it
  // is judging existing copy, but a page written to order should contain none.
  const lower = text.toLowerCase();
  for (const phrase of AI_PHRASES)
    if (lower.includes(phrase)) found.push(`Marketing filler: "${phrase}"`);

  // Copy that announces a gap, or worse, reasons from one. Both were found on
  // live pages. `isAdmission` is the same function the stripper uses, so the
  // button cannot write what the stripper would immediately remove.
  for (const sentence of text.split(/(?<=[.!?])\s+/))
    if (isAdmission(sentence.trim())) {
      found.push(
        `It admits or guesses at a gap: "${sentence.trim().slice(0, 90)}"`,
      );
      break;
    }

  return found;
}

let key = 0;

/** Written sections to Portable Text. */
export function sectionsToBlocks(sections: WrittenSection[]) {
  const blocks: unknown[] = [];
  const block = (text: string, style: string, listItem?: "bullet") => {
    const id = `w${Date.now().toString(36)}-${key++}`;
    return {
      _type: "block",
      _key: id,
      style,
      markDefs: [],
      ...(listItem ? { listItem, level: 1 } : {}),
      children: [{ _type: "span", _key: `${id}-s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
    for (const bullet of section.bullets ?? [])
      blocks.push(block(bullet, "normal", "bullet"));
  }
  return blocks;
}
