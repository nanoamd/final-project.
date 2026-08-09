import { describe, expect, it } from "vitest";

import {
  cleanSupplierTitle,
  titleFingerprint,
} from "./import-supplier-products";

describe("cleanSupplierTitle", () => {
  it("replaces the supplier's SEO tail with ours", () => {
    expect(
      cleanSupplierTitle(
        "Abberley Brown Coffee Table | Trade Furniture | DI Designs",
      ),
    ).toBe("Abberley Brown Coffee Table | Kaiku");
  });

  it("keeps a segment that carries product information", () => {
    // The size is not branding — dropping it would lose the only thing telling
    // two variants apart.
    expect(
      cleanSupplierTitle(
        "Himalayan Salt BBQ Plate | 30 x 20 x 5cm | DI Designs",
      ),
    ).toBe("Himalayan Salt BBQ Plate | 30 x 20 x 5cm | Kaiku");
  });

  it("does not duplicate an existing Kaiku suffix on a re-import", () => {
    expect(cleanSupplierTitle("Witley Coffee Table | Kaiku")).toBe(
      "Witley Coffee Table | Kaiku",
    );
  });

  it("adds the suffix to a plain title", () => {
    expect(
      cleanSupplierTitle("Pershore Rectangular Aged Oak Coffee Table"),
    ).toBe("Pershore Rectangular Aged Oak Coffee Table | Kaiku");
  });

  it("never strips the first segment, even when it reads like a brand", () => {
    expect(cleanSupplierTitle("DI Designs | Free UK Delivery")).toBe(
      "DI Designs | Kaiku",
    );
  });

  it("drops several branding segments at once", () => {
    expect(
      cleanSupplierTitle(
        "Crofton Coffee Table | Wholesale | Buy Online | Home",
      ),
    ).toBe("Crofton Coffee Table | Kaiku");
  });
});

describe("titleFingerprint", () => {
  it("matches the same product under a different word order", () => {
    // The actual case: the supplier's page against what is already listed.
    expect(titleFingerprint("Abberley Brown Coffee Table | Kaiku")).toBe(
      titleFingerprint("Abberley Coffee Table in Brown | Kaiku"),
    );
  });

  it("keeps two colourways of one table apart", () => {
    expect(titleFingerprint("Bentley Coffee Table in Oak")).not.toBe(
      titleFingerprint("Bentley Coffee Table in Grey"),
    );
  });

  it("keeps two sizes of one product apart", () => {
    expect(titleFingerprint("Natural Teak Corner Shelf Unit 3 Tier")).not.toBe(
      titleFingerprint("Natural Teak Corner Shelf Unit 4 Tier"),
    );
  });

  it("ignores punctuation and case", () => {
    expect(titleFingerprint("Reclaimed Teak — Console Table, 3 Drawers")).toBe(
      titleFingerprint("reclaimed teak console table 3 drawers"),
    );
  });

  it("is unaffected by the Kaiku suffix, so an import matches a listed product", () => {
    expect(titleFingerprint("Witley Coffee Table | Kaiku")).toBe(
      titleFingerprint("Witley Coffee Table"),
    );
  });

  it("does not collapse genuinely different products", () => {
    expect(titleFingerprint("Small Reclaimed Teak Coffee Table")).not.toBe(
      titleFingerprint("Large Reclaimed Teak Coffee Table"),
    );
  });
});
