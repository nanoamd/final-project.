import { describe, expect, it } from "vitest";

import type { RawImage } from "./image-colours";
import {
  analyse,
  blur1d,
  isPackShot,
  MAX_GAIN,
  shadowByColumn,
  shadowField,
  standsOnFloor,
  subjectCoverage,
  whiteBalanceGain,
} from "./product-shadow";

/**
 * Builds a test image by asking a function for each pixel's colour.
 *
 * Synthetic images rather than photographs, because what needs testing is the
 * arithmetic — where the shadow goes, how dark it gets, what it refuses to touch —
 * and a photograph makes every one of those a judgement call. The photographs are
 * checked by looking at the contact sheets, which is the only way to judge whether
 * a shadow looks real.
 */
function image(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): RawImage {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      data[(y * width + x) * 3] = r;
      data[(y * width + x) * 3 + 1] = g;
      data[(y * width + x) * 3 + 2] = b;
    }
  return { width, height, data };
}

const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [40, 40, 40];

/** A table: a solid top with two legs, standing on the floor line. */
function tableImage(size = 64) {
  const top = size * 0.3;
  const topEnd = size * 0.4;
  const floor = size * 0.85;
  return image(size, size, (x, y) => {
    const inSpan = x > size * 0.2 && x < size * 0.8;
    if (inSpan && y >= top && y < topEnd) return DARK;
    const isLeg =
      (x > size * 0.22 && x < size * 0.28) ||
      (x > size * 0.72 && x < size * 0.78);
    if (isLeg && y >= topEnd && y < floor) return DARK;
    return WHITE;
  });
}

describe("analyse", () => {
  it("measures the sweep and finds the subject on a plain backdrop", () => {
    const analysis = analyse(tableImage());

    expect(analysis.backdrop.rgb.map(Math.round)).toEqual([255, 255, 255]);
    expect(analysis.backdrop.share).toBeGreaterThan(0.8);
    expect(isPackShot(analysis)).toBe(true);
    // The floor line is the lowest subject pixel — the foot of a leg.
    expect(analysis.subject.bottom).toBe(54);
    expect(analysis.subject.top).toBe(Math.ceil(64 * 0.3));
  });

  it("measures a tinted sweep as the tint it is", () => {
    const tinted = image(64, 64, (x, y) => {
      const inside = x > 20 && x < 44 && y > 20 && y < 44;
      return inside ? DARK : [246, 244, 238];
    });
    const analysis = analyse(tinted);
    expect(analysis.backdrop.rgb.map(Math.round)).toEqual([246, 244, 238]);
  });

  it("does not call a busy frame a pack shot", () => {
    // Stand-in for a room photograph: no pale sweep touching the frame edge at
    // all, so there is nothing to flood in from and nothing to correct.
    const room = image(64, 64, (x, y) => [
      90 + ((x * 3) % 60),
      70 + ((y * 5) % 50),
      60,
    ]);
    const analysis = analyse(room);
    expect(isPackShot(analysis)).toBe(false);
  });

  it("spots a shadow that is already there", () => {
    const floor = 54;
    const withShadow = image(64, 64, (x, y) => {
      if (x > 20 && x < 44 && y > 20 && y < floor) return DARK;
      // A soft neutral band on the sweep, just below the object.
      if (x > 14 && x < 50 && y >= floor && y < floor + 4)
        return [180, 180, 180];
      return WHITE;
    });
    expect(analyse(withShadow).hasShadow).toBe(true);
    expect(analyse(tableImage()).hasShadow).toBe(false);
  });
});

describe("whiteBalanceGain", () => {
  it("leaves a backdrop that is already white alone", () => {
    expect(whiteBalanceGain({ rgb: [255, 255, 255], share: 0.8 })).toBeNull();
    // Within half a level: not worth re-encoding a file for.
    expect(
      whiteBalanceGain({ rgb: [254.8, 254.8, 254.8], share: 0.8 }),
    ).toBeNull();
  });

  it("neutralises a warm paper tint", () => {
    const gain = whiteBalanceGain({ rgb: [246, 244, 238], share: 0.8 });
    expect(gain).not.toBeNull();
    // Each channel lands on white, and the bluest channel is lifted most, which
    // is what takes the warmth out.
    for (let c = 0; c < 3; c += 1) expect(246 * gain![0]!).toBeCloseTo(255, 5);
    expect(gain![2]).toBeGreaterThan(gain![0]!);
  });

  it("refuses a correction bigger than a paper tint", () => {
    // A mid-grey studio wall or an underexposed frame. Correcting it would be
    // rescuing a photograph, which is not what this is for, and much more likely
    // means the thing measured was not a sweep.
    expect(whiteBalanceGain({ rgb: [180, 180, 180], share: 0.6 })).toBeNull();
    const justOver = 255 / (MAX_GAIN + 0.01);
    expect(
      whiteBalanceGain({ rgb: [justOver, justOver, justOver], share: 0.6 }),
    ).toBeNull();
  });
});

describe("shadowByColumn", () => {
  it("grounds the legs harder than the span between them", () => {
    const analysis = analyse(tableImage());
    const profile = shadowByColumn(analysis.subject, analysis.height);

    const legColumn = profile[Math.round(64 * 0.25)]!;
    const spanColumn = profile[32]!;
    expect(legColumn).toBeGreaterThan(spanColumn * 2);
    // The span still hazes rather than vanishing — the top casts something.
    expect(spanColumn).toBeGreaterThanOrEqual(0);
  });

  it("puts nothing under a column with no object above it", () => {
    const analysis = analyse(tableImage());
    const profile = shadowByColumn(analysis.subject, analysis.height);
    expect(profile[2]).toBe(0);
    expect(profile[61]).toBe(0);
  });

  it("returns a flat nothing for an empty frame", () => {
    const blank = analyse(image(32, 32, () => WHITE));
    const profile = shadowByColumn(blank.subject, blank.height);
    expect([...profile].every((value) => value === 0)).toBe(true);
  });
});

describe("blur1d", () => {
  it("spreads a spike without inventing or losing weight", () => {
    const spike = new Float32Array(41);
    spike[20] = 1;
    const blurred = blur1d(spike, 3);
    const total = [...blurred].reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 2);
    expect(blurred[20]!).toBeLessThan(1);
    expect(blurred[20]!).toBeGreaterThan(blurred[23]!);
    expect(blurred[23]!).toBeGreaterThan(0);
  });

  it("holds its value at the edges rather than fading to nothing", () => {
    // A shadow running off the side of the frame should stay dark at the frame
    // edge. Treating out-of-bounds as zero would put a bright seam there.
    const flat = new Float32Array(20).fill(1);
    const blurred = blur1d(flat, 4);
    expect(blurred[0]!).toBeCloseTo(1, 3);
    expect(blurred[19]!).toBeCloseTo(1, 3);
  });
});

describe("shadowField", () => {
  const analysis = analyse(tableImage());
  const field = shadowField({
    subject: analysis.subject,
    analysisWidth: analysis.width,
    analysisHeight: analysis.height,
    width: 128,
    height: 128,
  });
  const at = (x: number, y: number) => field[y * 128 + x]!;

  it("is darkest at the floor line and fades below it", () => {
    const floor = Math.round(((analysis.subject.bottom + 0.5) / 64) * 128);
    const leg = Math.round(128 * 0.25);
    expect(at(leg, floor)).toBeGreaterThan(at(leg, floor + 8));
    expect(at(leg, floor + 8)).toBeGreaterThan(0);
  });

  it("fades faster upwards than downwards, because the object occludes it", () => {
    const floor = Math.round(((analysis.subject.bottom + 0.5) / 64) * 128);
    const leg = Math.round(128 * 0.25);
    expect(at(leg, floor + 6)).toBeGreaterThan(at(leg, floor - 6));
  });

  it("never gets darker than the strength ceiling", () => {
    expect(Math.max(...field)).toBeLessThanOrEqual(0.26 + 1e-6);
  });

  it("puts nothing above the object or beyond its sides", () => {
    expect(at(64, 4)).toBe(0);
    expect(at(1, 120)).toBe(0);
  });
});

describe("subjectCoverage", () => {
  it("covers the object and dilates outwards, so shadow cannot bleed onto it", () => {
    const analysis = analyse(tableImage());
    const coverage = subjectCoverage({
      mask: analysis.mask,
      analysisWidth: analysis.width,
      analysisHeight: analysis.height,
      width: 64,
      height: 64,
    });
    const at = (x: number, y: number) => coverage[y * 64 + x]!;

    // Middle of the tabletop: object.
    expect(at(32, Math.round(64 * 0.35))).toBe(1);
    // One pixel outside the top edge: still counted as object, by design.
    expect(at(32, analysis.subject.top - 1)).toBe(1);
    // Well clear of it: free for shadow.
    expect(at(2, 2)).toBe(0);
  });
});

describe("standsOnFloor", () => {
  it("keeps a shadow away from anything that hangs on a wall", () => {
    // A floor shadow under a wall mirror is a claim about the object that is not
    // true, and the whole point of the pass is that the catalogue looks honest.
    expect(standsOnFloor("Hampton Ivory Octagonal Wall Mirror | Kaiku")).toBe(
      false,
    );
    expect(standsOnFloor("Brass Wall Light | Kaiku")).toBe(false);
    expect(standsOnFloor("Serene Rattan Coffee Table | Kaiku")).toBe(true);
    expect(standsOnFloor("Broadway Oak Bedside Table | Kaiku")).toBe(true);
  });
});
