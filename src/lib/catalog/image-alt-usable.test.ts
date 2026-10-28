import { describe, expect, it } from "vitest";

import { usableAlt } from "./image-alt";

describe("usableAlt", () => {
  it("keeps a real description", () => {
    expect(usableAlt("Rutland Rectangular Bench")).toBe(
      "Rutland Rectangular Bench",
    );
    expect(
      usableAlt("Camden Round Side Table, in grey ceramic — view 3 of 5"),
    ).toBe("Camden Round Side Table, in grey ceramic — view 3 of 5");
  });

  /** The string that prompted this, rendered live on /shop/sofas. */
  it("rejects a leaked composition line", () => {
    expect(
      usableAlt(
        "Hayton Black Velvet Sofa Bed, in polyester, velvet, cotton 0%," +
          "eucalyptus wood 0% cart weight — main product image",
      ),
    ).toBeUndefined();
  });

  it("rejects any percentage figure", () => {
    expect(usableAlt("Glass 63%, Iron 5% vase")).toBeUndefined();
    expect(usableAlt("Oak sideboard, 100 % oak")).toBeUndefined();
  });

  it("rejects the cart weight artefact on its own", () => {
    expect(usableAlt("Mirror cart weight")).toBeUndefined();
  });

  it("rejects a long comma list but not a short one", () => {
    expect(usableAlt("Sofa, in grey, velvet, oak, steel")).toBeUndefined();
    expect(usableAlt("Sofa, in grey velvet — main product image")).toBe(
      "Sofa, in grey velvet — main product image",
    );
  });

  /** Counts fragments before the em dash only, so the view label is free. */
  it("does not count the view label against the limit", () => {
    expect(
      usableAlt("Lamp, in brass — view 2 of 6, photographed on a desk"),
    ).toBe("Lamp, in brass — view 2 of 6, photographed on a desk");
  });

  it("treats blank and missing as nothing to use", () => {
    for (const input of [null, undefined, "", "   "]) {
      expect(usableAlt(input)).toBeUndefined();
    }
  });
});
