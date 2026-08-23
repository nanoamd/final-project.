import { describe, expect, it } from "vitest";

import { buildAlt } from "./image-alt";

describe("alt text identifies the product accurately", () => {
  it("names the product and drops the brand suffix", () => {
    expect(
      buildAlt({
        title: "Aged Stone Tall Ceramic Vase | Kaiku",
        index: 0,
        total: 1,
      }),
    ).toBe("Aged Stone Tall Ceramic Vase");
  });

  it("adds colour and material when the name does not already say them", () => {
    expect(
      buildAlt({
        title: "Gisela Vase | Kaiku",
        index: 0,
        total: 1,
        material: "ceramic",
        primaryColour: "Grey",
      }),
    ).toBe("Gisela Vase, in grey ceramic");
  });

  it("does not repeat a word the product name already contains", () => {
    // "Grey Glazed Ceramic Vase, in grey ceramic" reads as a stutter.
    const alt = buildAlt({
      title: "Garda Grey Glazed Ceramic Vase | Kaiku",
      index: 0,
      total: 1,
      material: "ceramic",
      primaryColour: "Grey",
    });
    expect(alt).toBe("Garda Grey Glazed Ceramic Vase");
  });

  it("numbers the view when there is more than one image", () => {
    expect(buildAlt({ title: "Oak Console | Kaiku", index: 0, total: 4 })).toBe(
      "Oak Console — main product image",
    );
    expect(buildAlt({ title: "Oak Console | Kaiku", index: 2, total: 4 })).toBe(
      "Oak Console — view 3 of 4",
    );
  });

  it("says nothing about what a later photograph shows", () => {
    // Calling image three a "detail shot" would be a guess about a picture
    // nobody has looked at.
    const alt = buildAlt({ title: "Oak Console | Kaiku", index: 2, total: 4 });
    expect(alt).not.toMatch(/detail|close-?up|room setting|lifestyle/i);
  });

  it("omits the view label for a single image", () => {
    expect(buildAlt({ title: "Oak Console | Kaiku", index: 0, total: 1 })).toBe(
      "Oak Console",
    );
  });

  it("never returns an empty string, because a product photo is never decorative", () => {
    expect(buildAlt({ title: "", index: 0, total: 1 })).toBe("Product image");
    expect(buildAlt({ title: "", index: 1, total: 3, category: "Vases" })).toBe(
      "Vases product image — view 2 of 3",
    );
  });
});
