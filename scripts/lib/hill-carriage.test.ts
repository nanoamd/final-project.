import { describe, expect, it } from "vitest";

import { hillCarriage, serviceFor } from "./hill-carriage";

/**
 * The two invoices Damien actually paid. These are the only hard facts in the
 * whole carriage question and every other number in here is the rate card
 * read around them, so they go first.
 */
describe("the two real invoices", () => {
  it("Contour sideboard: 15kg, Large -> £49.99 ex / £59.99 inc", () => {
    const c = hillCarriage({ weightKg: 15, deliverySize: "Large" });
    expect(c.exVat).toBe(49.99);
    expect(c.incVat).toBe(59.99);
    expect(c.service).toBe("two-man");
    expect(c.estimated).toBe(false);
  });

  it("Sorelle sofa: 39.9kg, Large -> £59.99 ex / £71.99 inc", () => {
    const c = hillCarriage({ weightKg: 39.9, deliverySize: "Large" });
    expect(c.exVat).toBe(59.99);
    expect(c.incVat).toBe(71.99);
    expect(c.service).toBe("two-man");
    expect(c.estimated).toBe(false);
  });

  it("would have caught the Contour error: weight alone says £9.99", () => {
    // The old reprice script banded on weight alone and charged a 15kg piece
    // the courier rate. Hill charged five times that.
    expect(hillCarriage({ weightKg: 15, deliverySize: "Small" }).exVat).toBe(
      9.99,
    );
    expect(hillCarriage({ weightKg: 15, deliverySize: "Large" }).exVat).toBe(
      49.99,
    );
  });
});

describe("small items are not two-man", () => {
  it("a 2.6kg canvas goes by courier at £6.99, not £49.99", () => {
    // Two-man at every weight is why 84 of 140 Hill products read as
    // loss-making. A picture frame was wearing a sofa's delivery cost.
    const c = hillCarriage({ weightKg: 2.6, deliverySize: "Small" });
    expect(c.exVat).toBe(6.99);
    expect(c.incVat).toBe(8.39);
    expect(c.service).toBe("courier");
  });
});

describe("courier bands", () => {
  it.each([
    [1, 6.99],
    [10, 6.99],
    [10.1, 9.99],
    [20, 9.99],
    [25, 14.99],
    [40, 14.99],
    [41, 24.99],
    [120, 24.99],
  ])("%skg -> £%s", (kg, amount) => {
    expect(hillCarriage({ weightKg: kg, deliverySize: "Small" }).exVat).toBe(
      amount,
    );
  });
});

describe("two-man bands", () => {
  it.each([
    [5, 49.99],
    [35, 49.99],
    [36, 59.99],
    [60, 59.99],
    [61, 69.99],
    [100, 69.99],
    [101, 84.99],
    [150, 84.99],
    [151, 109.99],
    [400, 109.99],
  ])("%skg -> £%s", (kg, amount) => {
    expect(hillCarriage({ weightKg: kg, deliverySize: "Large" }).exVat).toBe(
      amount,
    );
  });
});

describe("serviceFor", () => {
  it("reads Hill's flag however it is cased or padded", () => {
    expect(serviceFor(" Large ")).toBe("two-man");
    expect(serviceFor("SMALL")).toBe("courier");
  });

  it("is null for anything it does not recognise, rather than a default", () => {
    for (const v of ["", "   ", "Medium", null, undefined])
      expect(serviceFor(v)).toBeNull();
  });
});

describe("missing inputs are reported, not invented", () => {
  it("flags a row with neither input and writes no figure", () => {
    const c = hillCarriage({ weightKg: null, deliverySize: null });
    expect(c.estimated).toBe(true);
    expect(c.exVat).toBe(0);
    expect(c.reason).toMatch(/resolve by hand/);
  });

  it("assumes the dearer service when only weight is known", () => {
    // Understating landed cost is the expensive error — it prices the shop
    // below its own cost. Overstating only makes a line look unattractive.
    const c = hillCarriage({ weightKg: 15, deliverySize: "" });
    expect(c.estimated).toBe(true);
    expect(c.service).toBe("two-man");
    expect(c.exVat).toBe(49.99);
  });

  it("keeps the service but flags the band when weight is missing", () => {
    const large = hillCarriage({ weightKg: null, deliverySize: "Large" });
    expect(large.service).toBe("two-man");
    expect(large.exVat).toBe(59.99);
    expect(large.estimated).toBe(true);

    const small = hillCarriage({ weightKg: 0, deliverySize: "Small" });
    expect(small.service).toBe("courier");
    expect(small.exVat).toBe(14.99);
    expect(small.estimated).toBe(true);
  });
});
