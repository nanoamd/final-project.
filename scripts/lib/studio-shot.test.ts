import { describe, expect, it } from "vitest";

import {
  canReorder,
  classifyShot,
  isPlainBackground,
  lightness,
  orderChanges,
  preferredOrder,
  type RawImage,
  type Shot,
  type ShotKind,
} from "./studio-shot";

/** A measured shot. `whiteFraction` defaults to a full product shot on white. */
function shot(kind: ShotKind, whiteFraction = 1): Shot {
  return { kind, whiteFraction };
}

/**
 * Builds a raw RGB image from a per-pixel function, so a test can describe the
 * picture it means rather than a byte array.
 */
function image(
  width: number,
  height: number,
  at: (x: number, y: number) => [number, number, number],
): RawImage {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = at(x, y);
      const offset = (y * width + x) * 3;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
    }
  return { width, height, data };
}

const WHITE: [number, number, number] = [252, 252, 250];
const CHARCOAL: [number, number, number] = [58, 56, 52];
/** A sunlit cream wall — bright, but carrying colour. The case that must not
 *  be mistaken for a studio sweep. */
const CREAM_WALL: [number, number, number] = [244, 228, 196];

/** Product centred on a sweep: white frame all the way round. */
function onSweep(inset = 5) {
  return image(20, 20, (x, y) =>
    x >= inset && x < 20 - inset && y >= inset && y < 20 - inset
      ? CHARCOAL
      : WHITE,
  );
}

describe("lightness", () => {
  it("weights green the way the eye does", () => {
    expect(lightness({ r: 0, g: 255, b: 0 })).toBeGreaterThan(
      lightness({ r: 255, g: 0, b: 0 }),
    );
  });

  it("is 0 for black and ~255 for white", () => {
    expect(lightness({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(Math.round(lightness({ r: 255, g: 255, b: 255 }))).toBe(255);
  });
});

describe("classifyShot", () => {
  it("calls a product on a white sweep a catalogue shot", () => {
    expect(classifyShot(onSweep()).kind).toBe("catalogue");
  });

  it("calls a photograph with no white edge at all lifestyle", () => {
    const room = image(20, 20, (x, y) => [
      40 + ((x * 7) % 90),
      60 + ((y * 5) % 80),
      30 + ((x + y) % 70),
    ]);
    expect(classifyShot(room).kind).toBe("lifestyle");
  });

  it("does not mistake a bright cream wall for a sweep — it carries colour", () => {
    const wall = image(20, 20, () => CREAM_WALL);
    // Bright enough to pass a lightness test, so this is the case that proves
    // neutrality is doing work rather than being decoration.
    expect(lightness({ r: 244, g: 228, b: 196 })).toBeGreaterThan(220);
    expect(classifyShot(wall).kind).toBe("lifestyle");
  });

  it("still calls a tightly-cropped product on white a catalogue shot", () => {
    // The barrel case: the product nearly fills the frame, so only a thin band
    // of sweep survives at the edge. An earlier draft graded this as a detail
    // crop and demoted it out of position one.
    expect(classifyShot(onSweep(1)).kind).toBe("catalogue");
  });

  it("reports the measurement it decided on, for the dry run to print", () => {
    const verdict = classifyShot(onSweep());
    expect(verdict.whiteFraction).toBeGreaterThan(0.9);
    expect(verdict.reason).toMatch(/% white border/);
  });

  it("declines to guess when the frame is half backdrop, half something else", () => {
    const half = image(20, 20, (x, y) =>
      // Top and bottom edges white, left and right edges mid-grey: 50% white.
      y === 0 || y === 19
        ? WHITE
        : x === 0 || x === 19
          ? [140, 140, 140]
          : WHITE,
    );
    const verdict = classifyShot(half);
    expect(["catalogue", "unknown"]).toContain(verdict.kind);
  });

  it("is unknown for a thumbnail too small to sample", () => {
    expect(classifyShot(image(2, 2, () => WHITE)).kind).toBe("unknown");
  });
});

describe("preferredOrder", () => {
  it("promotes the catalogue shot and puts lifestyle second, so it becomes the hover", () => {
    expect(preferredOrder([shot("lifestyle"), shot("catalogue")])).toEqual([
      1, 0,
    ]);
  });

  it("keeps the editor's sequence within each group", () => {
    expect(
      preferredOrder([
        shot("lifestyle"),
        shot("catalogue"),
        shot("lifestyle"),
        shot("catalogue"),
      ]),
    ).toEqual([1, 3, 0, 2]);
  });

  it("sinks undecided images below both, rather than promoting a guess", () => {
    expect(
      preferredOrder([shot("unknown"), shot("lifestyle"), shot("catalogue")]),
    ).toEqual([2, 1, 0]);
  });

  it("leaves an already-correct gallery alone", () => {
    const order = preferredOrder([
      shot("catalogue"),
      shot("catalogue"),
      shot("lifestyle"),
    ]);
    expect(orderChanges(order)).toBe(false);
  });

  it("lifts a fuller product shot above a tight crop that leads the gallery", () => {
    // The Pershore case: image one is a close-up of the table edge at 45% white
    // border, the other three show the whole table at 100%. On the phone grid it
    // was the only tile not showing a table.
    expect(
      preferredOrder([
        shot("catalogue", 0.45),
        shot("catalogue", 1),
        shot("catalogue", 1),
        shot("lifestyle", 0),
      ]),
    ).toEqual([1, 0, 2, 3]);
  });

  it("moves one image, not the whole group — the rest keep the editor's order", () => {
    const order = preferredOrder([
      shot("catalogue", 0.3),
      shot("catalogue", 0.7),
      shot("catalogue", 0.95),
    ]);
    // 0.7 is neither a tight crop nor a clearly full shot, so it is not promoted
    // and it does not move.
    expect(order).toEqual([2, 0, 1]);
  });

  it("does nothing when every catalogue shot is equally full", () => {
    const order = preferredOrder([shot("catalogue"), shot("catalogue")]);
    expect(orderChanges(order)).toBe(false);
  });

  it("does nothing when the tight leader has no fuller alternative", () => {
    const order = preferredOrder([
      shot("catalogue", 0.3),
      shot("catalogue", 0.5),
    ]);
    expect(orderChanges(order)).toBe(false);
  });
});

describe("canReorder", () => {
  it("refuses when nothing was confidently identified as a catalogue shot", () => {
    // Without one, there is nothing to promote and shuffling the rest is churn
    // on an editor's arrangement for no gain.
    expect(canReorder([shot("lifestyle"), shot("unknown")])).toBe(false);
    expect(canReorder([shot("unknown"), shot("unknown")])).toBe(false);
  });

  it("allows it as soon as there is one", () => {
    expect(canReorder([shot("lifestyle"), shot("catalogue")])).toBe(true);
  });
});

describe("isPlainBackground", () => {
  it("is what isStudioShot means, and only the catalogue class earns it", () => {
    expect(isPlainBackground("catalogue")).toBe(true);
    expect(isPlainBackground("lifestyle")).toBe(false);
    expect(isPlainBackground("unknown")).toBe(false);
  });
});
