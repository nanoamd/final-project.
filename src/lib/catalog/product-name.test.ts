import { describe, expect, it } from "vitest";

import { productDisplayName } from "./product-name";

describe("productDisplayName", () => {
  it("removes the brand suffix real titles carry", () => {
    // Both live on the site today.
    expect(
      productDisplayName(
        "13.6m Warm White Decorative LED String Lights | Kaiku",
      ),
    ).toBe("13.6m Warm White Decorative LED String Lights");
    expect(productDisplayName("Camden Round Side Table | Kaiku")).toBe(
      "Camden Round Side Table",
    );
  });

  it("handles the separators an editor might have used", () => {
    expect(productDisplayName("Rutland Side Table — Kaiku")).toBe(
      "Rutland Side Table",
    );
    expect(productDisplayName("Rutland Side Table - Kaiku")).toBe(
      "Rutland Side Table",
    );
    expect(productDisplayName("Rutland Side Table | kaiku")).toBe(
      "Rutland Side Table",
    );
    expect(productDisplayName("Rutland Side Table | Kaiku Home")).toBe(
      "Rutland Side Table",
    );
  });

  it("strips a doubled suffix", () => {
    expect(productDisplayName("Alto Outdoor Table | Kaiku | Kaiku")).toBe(
      "Alto Outdoor Table",
    );
  });

  it("leaves a pipe that is doing work", () => {
    // The reason this is not `title.split("|")[0]`. A separator only means "brand
    // suffix" when the brand is what follows it.
    expect(productDisplayName("Ashcombe Bench | Set of 2")).toBe(
      "Ashcombe Bench | Set of 2",
    );
    expect(productDisplayName("Provence Dining Set | 4 Seater | Kaiku")).toBe(
      "Provence Dining Set | 4 Seater",
    );
  });

  it("leaves the brand alone when it is inside the name", () => {
    expect(productDisplayName("Kaiku Signature Throw")).toBe(
      "Kaiku Signature Throw",
    );
  });

  it("never returns an empty name", () => {
    // A blank <h1> is worse than a clumsy one.
    expect(productDisplayName("Kaiku")).toBe("Kaiku");
    expect(productDisplayName("| Kaiku")).toBe("| Kaiku");
  });

  it("trims stray whitespace", () => {
    expect(productDisplayName("  Camden Round Side Table |  Kaiku  ")).toBe(
      "Camden Round Side Table",
    );
  });
});
