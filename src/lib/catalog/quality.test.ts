import { describe, expect, it } from "vitest";

import { AI_PHRASES, echoes, type QualityInput, scoreProduct } from "./quality";

/** A product with nothing wrong with it, to vary one field at a time from. */
const SOUND: QualityInput = {
  title: "Natural Teak Corner Shelf Unit – 3 Tier Display Stand 90cm | Kaiku",
  slug: "natural-teak-corner-shelf-unit-3-tier",
  summary: "A three-tier corner shelf in solid teak, 90cm tall.",
  descriptionText:
    "Solid teak, finished with a light oil. The unit stands 90cm tall and 32cm across each face. Each of the 3 tiers holds up to 8kg. It arrives assembled. Teak greys outdoors within 12 months unless re-oiled.",
  headings: ["Materials and Finish", "Dimensions and Placement"],
  price: 129,
  costPrice: 70,
  shippingCost: 0,
  sku: "KAI-SHL-001",
  supplierSku: "AW-TEAK-90",
  gtin: "5060000000001",
  supplier: "AW Dropship",
  dimensions: { height: 90, width: 32 },
  weight: { value: 6, unit: "kg" },
  galleryCount: 4,
  seoTitle: "Natural Teak Corner Shelf Unit | Kaiku",
  seoDescription: "A three-tier solid teak corner shelf, 90cm tall.",
  published: true,
};

describe("specificity is the load-bearing measure", () => {
  it("rewards a short description dense with facts", () => {
    const result = scoreProduct(SOUND);
    expect(result.stats.facts).toBeGreaterThan(3);
    expect(result.scores.specificity).toBeGreaterThan(7);
  });

  it("fails a long description carrying no facts, however polished", () => {
    // The real case this was written for: a 1,633-word mirror listing with not
    // one measurement in it.
    const result = scoreProduct({
      ...SOUND,
      summary: "A lovely mirror.",
      descriptionText: "A lovely mirror that suits any room. ".repeat(200),
      headings: ["Features", "Specifications"],
    });
    expect(result.stats.facts).toBe(0);
    expect(result.scores.specificity).toBe(0);
    expect(result.tier).toBe("REVIEW");
  });

  it("scores the short dense page above the long empty one", () => {
    const dense = scoreProduct(SOUND);
    const padded = scoreProduct({
      ...SOUND,
      summary: "A lovely mirror.",
      descriptionText: "A lovely mirror that suits any room. ".repeat(200),
    });
    expect(dense.overall).toBeGreaterThan(padded.overall);
  });

  it("counts a hyphenated fact like 6-Person", () => {
    // An earlier regex required a space and scored the barrel saunas at zero.
    const result = scoreProduct({
      ...SOUND,
      descriptionText: "A 6-Person barrel sauna with a 9kW heater.",
    });
    expect(result.stats.facts).toBeGreaterThanOrEqual(2);
  });
});

describe("blockers are disqualifying regardless of the average", () => {
  it("will not award GOLD to a product with no price", () => {
    const result = scoreProduct({ ...SOUND, price: null });
    expect(result.tier).toBe("REVIEW");
    expect(["D", "E"]).toContain(result.grade);
  });

  it("will not award GOLD to a product with no images", () => {
    expect(scoreProduct({ ...SOUND, galleryCount: 0 }).tier).toBe("REVIEW");
  });

  it("flags a loss-making product as a blocker", () => {
    const result = scoreProduct({ ...SOUND, price: 60, costPrice: 70 });
    expect(
      result.findings.some(
        (f) => f.severity === "blocker" && /Loss-making/.test(f.message),
      ),
    ).toBe(true);
  });

  it("counts carriage against the margin", () => {
    // £129 sell, £70 cost looks like 45%; £70 carriage makes it a loss.
    const result = scoreProduct({ ...SOUND, shippingCost: 70 });
    expect(result.findings.some((f) => /Loss-making/.test(f.message))).toBe(
      true,
    );
  });

  it("treats an unrecorded carriage cost as an optimistic margin, not a free one", () => {
    const result = scoreProduct({ ...SOUND, shippingCost: null });
    expect(result.findings.some((f) => /optimistic/.test(f.message))).toBe(
      true,
    );
  });
});

describe("the standing constraints are enforced", () => {
  it("flags a title without the Kaiku suffix", () => {
    const result = scoreProduct({ ...SOUND, title: "Teak Corner Shelf" });
    expect(result.findings.some((f) => /Kaiku/.test(f.message))).toBe(true);
  });

  it("accepts a title that has it", () => {
    expect(
      scoreProduct(SOUND).findings.some((f) => /“\| Kaiku”/.test(f.message)),
    ).toBe(false);
  });

  it("catches a supplier name left in the description", () => {
    for (const leak of [
      "Supplied by D.I. Designs.",
      "See www.hill-interiors.com for more.",
      "Sourced from Premier Housewares.",
    ]) {
      const result = scoreProduct({
        ...SOUND,
        descriptionText: `${SOUND.descriptionText} ${leak}`,
      });
      expect(
        result.findings.some((f) => /Supplier name or link/.test(f.message)),
        leak,
      ).toBe(true);
    }
  });
});

describe("AI-pattern detection", () => {
  it("catches filler phrases", () => {
    const result = scoreProduct({
      ...SOUND,
      descriptionText:
        "This stunning piece will effortlessly elevate your home. Perfect for any space, it seamlessly adds a touch of timeless elegance. Whether you are hosting or relaxing, this must-have statement piece is sure to impress.",
    });
    expect(result.stats.aiPhrases.length).toBeGreaterThan(5);
    expect(result.scores.aiRisk).toBeLessThan(4);
  });

  it("does not punish a single turn of phrase in a long factual page", () => {
    const result = scoreProduct({
      ...SOUND,
      descriptionText: `${"The heater draws 9kW and reaches 90°C in 35 minutes. ".repeat(20)} Perfect for a small garden.`,
    });
    expect(result.scores.aiRisk).toBeGreaterThan(7);
  });

  it("does not fire on 'elevate' inside an unrelated word", () => {
    const result = scoreProduct({
      ...SOUND,
      descriptionText: "The sauna sits on an elevated platform 15cm high.",
    });
    expect(result.stats.aiPhrases).not.toContain("elevate your");
  });

  it("has no duplicate entries in the phrase list", () => {
    expect(new Set(AI_PHRASES).size).toBe(AI_PHRASES.length);
  });
});

describe("summary and description must not duplicate", () => {
  it("detects a summary that repeats the description's opening", () => {
    const opening =
      "The Glass Candle Holder from Kaiku is a stunning piece that combines form and warmth in one";
    expect(echoes(opening, `${opening}, and more besides.`)).toBe(true);
  });

  it("allows a summary that merely names the same product", () => {
    expect(
      echoes(
        "A three-tier teak corner shelf, 90cm tall.",
        "Solid teak, finished with a light oil and built for a corner.",
      ),
    ).toBe(false);
  });

  it("ignores very short strings rather than guessing", () => {
    expect(echoes("Teak shelf", "Teak shelf unit")).toBe(false);
  });

  it("scores the duplication as a finding", () => {
    const shared =
      "The Glass Candle Holder from Kaiku is a stunning piece that combines form";
    const result = scoreProduct({
      ...SOUND,
      summary: shared,
      descriptionText: `${shared} and warmth. It measures 12cm.`,
    });
    expect(result.stats.summaryEchoesDescription).toBe(true);
  });
});

describe("empty FAQs count against accuracy", () => {
  it("catches an answer that admits it knows nothing", () => {
    const result = scoreProduct({
      ...SOUND,
      faqs: [
        {
          question: "What are the dimensions?",
          answer: "Dimensions are not specified for this product.",
        },
      ],
    });
    expect(result.scores.accuracy).toBeLessThan(10);
    expect(result.findings.some((f) => /answer nothing/.test(f.message))).toBe(
      true,
    );
  });

  it("leaves a real answer alone", () => {
    const result = scoreProduct({
      ...SOUND,
      faqs: [{ question: "How tall is it?", answer: "It stands 90cm tall." }],
    });
    expect(result.scores.accuracy).toBe(10);
  });
});

describe("grades and tiers", () => {
  it("gives a sound product a good grade and a real tier", () => {
    const result = scoreProduct(SOUND);
    expect(["A", "B"]).toContain(result.grade);
    expect(["GOLD", "SILVER"]).toContain(result.tier);
  });

  it("never returns a score outside 0–10 on any dimension", () => {
    const brutal = scoreProduct({
      title: "x",
      descriptionText: "stunning piece ".repeat(200),
      price: 1,
      costPrice: 500,
      shippingCost: 200,
      galleryCount: 0,
    });
    for (const [dimension, value] of Object.entries(brutal.scores)) {
      expect(value, dimension).toBeGreaterThanOrEqual(0);
      expect(value, dimension).toBeLessThanOrEqual(10);
    }
    expect(brutal.overall).toBeGreaterThanOrEqual(0);
  });

  it("returns no negative zero", () => {
    const result = scoreProduct({ title: "x", galleryCount: 0 });
    for (const value of Object.values(result.scores)) {
      expect(Object.is(value, -0)).toBe(false);
    }
  });

  it("handles a completely empty product without throwing", () => {
    const result = scoreProduct({ title: "" });
    expect(result.tier).toBe("REVIEW");
    expect(result.stats.words).toBe(0);
  });
});

describe("generator artefacts, all found in the live catalogue", () => {
  const cases: [string, Partial<QualityInput>, RegExp][] = [
    [
      "raw template syntax",
      {
        descriptionText:
          "Care and Cleaning }},{ heading Delivery paragraphs :[ At Kaiku",
      },
      /template syntax/,
    ],
    [
      "markdown left in the text",
      {
        descriptionText:
          "Ideas to inspire you: - **Living Room:** place it on a mantel.",
      },
      /Markdown/,
    ],
    [
      "an HTML entity showing literally",
      { descriptionText: "Wicker Lantern With Glass Holder &amp; LED Lights." },
      /HTML entity/,
    ],
    [
      "chatbot phrasing",
      { faqs: [{ question: "Indoors?", answer: "Certainly! It suits both." }] },
      /Chatbot/,
    ],
    [
      "admitting it does not know",
      { descriptionText: "Colour: Clear. Dimensions: Not specified." },
      /does not know/,
    ],
    [
      "quoting the supplier as narrator",
      {
        descriptionText: "The supplier states that assembly needs two people.",
      },
      /the supplier/i,
    ],
    [
      "pointing at the page you are on",
      {
        faqs: [
          { question: "Price?", answer: "Please refer to the product page." },
        ],
      },
      /product page they are already on/,
    ],
    [
      "a delivery price threshold that contradicts free delivery",
      {
        faqs: [
          { question: "Delivery?", answer: "7-14 days for orders under £50." },
        ],
      },
      /free on everything/,
    ],
    [
      "a word repeated back to back",
      {
        descriptionText: "Specifications Specifications of the wreath follow.",
      },
      /repeated back to back/,
    ],
  ];

  for (const [name, patch, expected] of cases) {
    it(`catches ${name}`, () => {
      const result = scoreProduct({ ...SOUND, ...patch });
      expect(
        result.findings.some((f) => expected.test(f.message)),
        name,
      ).toBe(true);
    });
  }

  it("treats raw template syntax as a blocker, not a blemish", () => {
    const result = scoreProduct({
      ...SOUND,
      descriptionText: "The chair is , , , , ,, , , ,{ , , , , , , }",
    });
    expect(result.tier).toBe("REVIEW");
    expect(
      result.findings.some(
        (f) => f.severity === "blocker" && /template syntax/.test(f.message),
      ),
    ).toBe(true);
  });

  it("finds a supplier name in the summary, not only the description", () => {
    // 15 published summaries named a supplier and the first pass missed all of
    // them, because it looked only at the description.
    const result = scoreProduct({
      ...SOUND,
      summary: "Curated coffee tables from premium UK supplier D.I. Designs.",
    });
    expect(
      result.findings.some((f) => /Supplier name or link/.test(f.message)),
    ).toBe(true);
  });

  it("finds a supplier name inside an FAQ answer", () => {
    const result = scoreProduct({
      ...SOUND,
      faqs: [
        { question: "Who makes it?", answer: "It is made by Hill Interiors." },
      ],
    });
    expect(
      result.findings.some((f) => /Supplier name or link/.test(f.message)),
    ).toBe(true);
  });

  it("leaves clean copy alone", () => {
    const result = scoreProduct(SOUND);
    for (const bad of [
      /template syntax/,
      /Markdown/,
      /HTML entity/,
      /Chatbot/,
      /does not know/,
      /repeated back to back/,
    ]) {
      expect(
        result.findings.some((f) => bad.test(f.message)),
        String(bad),
      ).toBe(false);
    }
  });

  it("flags a SKU that is not in the house format", () => {
    const result = scoreProduct({ ...SOUND, skuIsCanonical: false });
    expect(result.findings.some((f) => /house format/.test(f.message))).toBe(
      true,
    );
  });
});
