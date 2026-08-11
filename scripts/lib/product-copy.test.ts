import { describe, expect, it } from "vitest";

import {
  buildDescription,
  faqKey,
  type ProductCopy,
  validateCopy,
} from "./product-copy";

const good: ProductCopy = {
  productId: "product-test",
  title: "Test Table",
  summary:
    "A round oak coffee table with a fluted base, hand-finished in aged oak and sized for a two-seater sofa without crowding the room.",
  sections: [
    {
      heading: "A base that does the talking",
      paragraphs: [
        "The fluted column is turned from solid oak, so the grain runs continuously around it rather than breaking at a joint.",
      ],
    },
    {
      heading: "Sized for real rooms",
      paragraphs: [
        "At 90cm across it sits comfortably in front of a two-seater.",
      ],
      bullets: ["90cm diameter", "45cm high", "Solid oak and oak veneer"],
    },
    {
      heading: "Caring for aged oak",
      paragraphs: [
        "Wipe with a dry cloth; avoid standing water on the surface.",
      ],
    },
  ],
  faqs: [
    {
      question: "Does the table arrive assembled?",
      answer: "Yes, fully built.",
    },
    {
      question: "Is the aged oak finish heat resistant?",
      answer: "Use a mat.",
    },
    { question: "How many mugs fit on the 90cm top?", answer: "Plenty." },
    { question: "Will it mark if a glass is left on it?", answer: "It can." },
  ],
};

describe("buildDescription", () => {
  it("gives every block and span a key", () => {
    const blocks = buildDescription(good.sections);
    for (const b of blocks) {
      expect(b._key).toBeTruthy();
      for (const child of b.children) expect(child._key).toBeTruthy();
    }
  });

  it("produces unique keys across the document", () => {
    const blocks = buildDescription(good.sections);
    const keys = blocks.map((b) => b._key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is deterministic, so an unchanged rerun is not a fake edit", () => {
    expect(buildDescription(good.sections)).toEqual(
      buildDescription(good.sections),
    );
  });

  it("makes headings h2, never h1", () => {
    const styles = buildDescription(good.sections)
      .filter((b) => b.style !== "normal")
      .map((b) => b.style);
    expect(styles).toEqual(["h2", "h2", "h2"]);
  });

  it("marks bullets as list items at level 1", () => {
    const bullets = buildDescription(good.sections).filter((b) => b.listItem);
    expect(bullets).toHaveLength(3);
    expect(bullets[0]!.level).toBe(1);
    expect(bullets[0]!.style).toBe("normal");
  });

  it("keeps sections in order with paragraphs before bullets", () => {
    const texts = buildDescription(good.sections).map(
      (b) => b.children[0]!.text,
    );
    expect(texts[0]).toBe("A base that does the talking");
    expect(texts[2]).toBe("Sized for real rooms");
    expect(texts[4]).toBe("90cm diameter");
  });
});

describe("validateCopy", () => {
  it("passes copy that follows the brief", () => {
    expect(validateCopy(good)).toEqual([]);
  });

  it("rejects the banned house phrases", () => {
    const issues = validateCopy({
      ...good,
      summary: "Perfect for luxury homes and boutique hotels.",
    });
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects the supplier's name", () => {
    const issues = validateCopy({
      ...good,
      sections: [
        { ...good.sections[0]!, paragraphs: ["Made by D.I. Designs."] },
        good.sections[1]!,
        good.sections[2]!,
      ],
    });
    expect(issues.some((i) => i.what.includes("names"))).toBe(true);
  });

  it("rejects URLs and drafting artefacts", () => {
    expect(
      validateCopy({
        ...good,
        summary: `${good.summary} https://example.com`,
      }).some((i) => i.what === "contains a URL"),
    ).toBe(true);
    expect(
      validateCopy({ ...good, summary: `Certainly! ${good.summary}` }).some(
        (i) => i.what === "contains a drafting artefact",
      ),
    ).toBe(true);
  });

  it("requires a heading on every section", () => {
    const issues = validateCopy({
      ...good,
      sections: [{ heading: "", paragraphs: ["Text."] }, ...good.sections],
    });
    expect(issues.some((i) => i.what === "a section has no heading")).toBe(
      true,
    );
  });

  it("requires at least three sections and four FAQs", () => {
    expect(
      validateCopy({ ...good, sections: [good.sections[0]!] }).some((i) =>
        i.what.includes("sections"),
      ),
    ).toBe(true);
    expect(
      validateCopy({ ...good, faqs: good.faqs.slice(0, 2) }).some((i) =>
        i.what.includes("FAQs"),
      ),
    ).toBe(true);
  });

  it("catches a FAQ repeated within the product", () => {
    const issues = validateCopy({
      ...good,
      faqs: [...good.faqs.slice(0, 3), good.faqs[0]!],
    });
    expect(issues.some((i) => i.what.startsWith("duplicate FAQ"))).toBe(true);
  });

  it("catches a FAQ already used on another product", () => {
    const issues = validateCopy(
      good,
      new Set([faqKey("Does the table arrive assembled?")]),
    );
    expect(
      issues.some((i) => i.what.startsWith("FAQ already used on another")),
    ).toBe(true);
  });

  it("rejects a summary too long for the Merchant feed", () => {
    const issues = validateCopy({ ...good, summary: "a".repeat(400) });
    expect(issues.some((i) => i.what.includes("truncates"))).toBe(true);
  });

  it("warns about stray whitespace in a question", () => {
    const issues = validateCopy({
      ...good,
      faqs: [
        { question: "Does it arrive built?  ", answer: "Yes." },
        ...good.faqs.slice(1),
      ],
    });
    expect(issues.some((i) => i.what.includes("stray whitespace"))).toBe(true);
  });
});
