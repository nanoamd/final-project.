import { describe, expect, it } from "vitest";

import {
  ART_HEIGHT,
  ART_WIDTH,
  type ArtMotif,
  artMotif,
  artPaths,
  artSeed,
} from "./artwork";

const MOTIFS: ArtMotif[] = [
  "wood-grain",
  "architectural",
  "water",
  "steam",
  "garden",
  "botanical",
  "radiance",
];

/** Every department in scripts/seed-sanity.ts. */
const DEPARTMENTS = [
  "outdoor-living",
  "living-room",
  "bedroom",
  "kitchen",
  "office",
  "bathroom",
  "lighting",
  "decor",
  "sauna",
  "cold-plunge",
  "outdoor-kitchen",
];

describe("artMotif", () => {
  it("gives furniture wood grain, wellness water or steam, and outdoor garden linework", () => {
    // Straight from the brief's own examples.
    expect(artMotif({ department: "living-room" })).toBe("wood-grain");
    expect(artMotif({ department: "bedroom" })).toBe("wood-grain");
    expect(artMotif({ department: "cold-plunge" })).toBe("water");
    expect(artMotif({ department: "sauna" })).toBe("steam");
    expect(artMotif({ department: "outdoor-living" })).toBe("garden");
  });

  it("lets a category override its department when its subject differs", () => {
    // A water feature and a parasol are both outdoor-living; garden linework is
    // only right for one of them.
    expect(
      artMotif({ department: "outdoor-living", category: "water-features" }),
    ).toBe("water");
    expect(
      artMotif({ department: "outdoor-living", category: "planters" }),
    ).toBe("botanical");
    expect(
      artMotif({ department: "outdoor-living", category: "garden-lighting" }),
    ).toBe("radiance");
    // …and leaves the department in charge otherwise.
    expect(
      artMotif({ department: "outdoor-living", category: "garden-furniture" }),
    ).toBe("garden");
  });

  it("covers every department, so no product falls through to a guess", () => {
    for (const department of DEPARTMENTS) {
      expect(MOTIFS).toContain(artMotif({ department }));
    }
  });

  it("falls back rather than throwing on an unknown or missing department", () => {
    // A product whose category has no department reference still has to render.
    expect(artMotif({})).toBe("wood-grain");
    expect(artMotif({ department: null, category: null })).toBe("wood-grain");
    expect(artMotif({ department: "conservatory" })).toBe("wood-grain");
  });
});

describe("artSeed", () => {
  it("is stable and differs between slugs", () => {
    expect(artSeed("camden-round-side-table")).toBe(
      artSeed("camden-round-side-table"),
    );
    expect(artSeed("camden-round-side-table")).not.toBe(
      artSeed("rutland-side-table"),
    );
  });

  it("copes with an empty slug", () => {
    expect(Number.isFinite(artSeed(""))).toBe(true);
  });
});

describe("artPaths", () => {
  it("draws the same panel for the same product every time", () => {
    // The panel is rendered on the server and hydrated on the client. Anything
    // non-deterministic here is a hydration mismatch on all 99 product pages.
    for (const motif of MOTIFS) {
      expect(artPaths(motif, "camden-round-side-table")).toEqual(
        artPaths(motif, "camden-round-side-table"),
      );
    }
  });

  it("draws a different panel for a different product", () => {
    for (const motif of MOTIFS) {
      const a = artPaths(motif, "camden-round-side-table");
      const b = artPaths(motif, "elmley-ivory-console-table");
      expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    }
  });

  it("never emits NaN or Infinity in a path", () => {
    // The failure this file exists for. A single NaN makes the whole path render
    // as nothing, silently — the panel would just be empty again, which is the
    // exact bug the artwork is meant to fix.
    for (const motif of MOTIFS) {
      for (const slug of ["a", "", "camden-round-side-table", "x".repeat(90)]) {
        for (const layer of artPaths(motif, slug)) {
          expect(layer.d).not.toMatch(/NaN|Infinity|undefined/);
          expect(layer.d.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("puts exactly one accent line in every panel family", () => {
    // "Consistent premium visual system" — one burnt-orange line per panel is the
    // rule that holds seven different generators together. Zero reads as a grey
    // watermark; several compete with the Add to Basket button.
    for (const motif of MOTIFS) {
      const accents = artPaths(motif, "camden-round-side-table").filter(
        (layer) => layer.weight === "accent",
      );
      expect(accents.length, motif).toBeGreaterThanOrEqual(1);
      expect(accents.length, motif).toBeLessThanOrEqual(2);
    }
  });

  it("keeps the drawing inside the panel", () => {
    // preserveAspectRatio="slice" crops the edges, so a little overshoot is fine;
    // a line at y=4000 means a generator has run away and the visible panel would
    // be a couple of stray strokes.
    const bounds = { x: ART_WIDTH * 1.5, y: ART_HEIGHT * 1.5 };
    for (const motif of MOTIFS) {
      for (const layer of artPaths(motif, "camden-round-side-table")) {
        for (const value of layer.d.match(/-?\d+(\.\d+)?/g) ?? []) {
          expect(Math.abs(Number(value))).toBeLessThan(
            Math.max(bounds.x, bounds.y),
          );
        }
      }
    }
  });

  it("draws enough lines to fill the space", () => {
    // A four-line panel is emptier than the empty space it replaced.
    for (const motif of MOTIFS) {
      expect(
        artPaths(motif, "camden-round-side-table").length,
        motif,
      ).toBeGreaterThanOrEqual(10);
    }
  });
});
