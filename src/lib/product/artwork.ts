/**
 * The decorative side-panel artwork for product pages.
 *
 * The brief: *"Some product pages contain large unused empty areas beside
 * descriptions. This space must not remain empty… Do not use product images.
 * Instead use decorative line artwork, architectural patterns, organic shapes,
 * botanical line drawings, minimal luxury illustrations… Each product page can have
 * variations while maintaining consistency."* Furniture gets fine wood-grain lines
 * and architectural sketches, wellness gets calm organic shapes and water patterns,
 * outdoor gets garden linework.
 *
 * Two requirements pull against each other there — *consistent* and *varied* — so
 * this does not ship a fixed set of SVG files. Each motif is a small generator, and
 * the product's own slug seeds it. That means:
 *
 *   - Every page in a department shares one visual language (the same generator).
 *   - No two products draw the same picture (a different seed).
 *   - A given product draws the same picture every time, on the server and on the
 *     client, today and next month. Nothing here reads `Math.random()` or a clock,
 *     because a hydration mismatch on 99 product pages would be a poor trade for
 *     decoration, and art that changes on refresh reads as a glitch rather than a
 *     design.
 *
 * Kept as pure functions returning path strings so the geometry can be tested
 * without a DOM — the failure mode that matters is a stray `NaN` in a `d`
 * attribute, which renders as nothing at all and would be invisible in review.
 */

/** The panel is portrait: it fills a column beside a tall block of text. */
export const ART_WIDTH = 400;
export const ART_HEIGHT = 560;

export type ArtMotif =
  | "wood-grain"
  | "architectural"
  | "water"
  | "steam"
  | "garden"
  | "botanical"
  | "radiance";

/**
 * How heavily a line is drawn. Three weights only — the depth in these panels comes
 * from density, not from colour. `accent` is the single burnt-orange line that stops
 * the panel reading as a watermark.
 */
export type ArtWeight = "hair" | "fine" | "accent";

export interface ArtLayer {
  d: string;
  weight: ArtWeight;
}

/* -------------------------------------------------------------------------- */
/* Which motif a product gets                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Department → motif. Covers all 11 departments in `scripts/seed-sanity.ts`;
 * anything unrecognised falls back to `wood-grain`, which is the quietest of the
 * seven and the right answer for most furniture.
 */
const DEPARTMENT_MOTIFS: Record<string, ArtMotif> = {
  "outdoor-living": "garden",
  "outdoor-kitchen": "garden",
  "living-room": "wood-grain",
  bedroom: "wood-grain",
  office: "architectural",
  kitchen: "architectural",
  bathroom: "water",
  sauna: "steam",
  "cold-plunge": "water",
  lighting: "radiance",
  decor: "botanical",
};

/**
 * Categories whose own subject is more specific than their department's.
 *
 * A water feature and a parasol are both `outdoor-living`, and garden linework is
 * only right for one of them. Deliberately short: the department is the rule and
 * this is the exception list, so a new category inherits a sensible motif rather
 * than needing an entry here.
 */
const CATEGORY_MOTIFS: Record<string, ArtMotif> = {
  "water-features": "water",
  "cold-plunges": "water",
  "outdoor-saunas": "steam",
  "indoor-saunas": "steam",
  "wellness-accessories": "steam",
  planters: "botanical",
  lighting: "radiance",
  "garden-lighting": "radiance",
  "bathroom-lighting": "radiance",
  "kitchen-lighting": "radiance",
  "fire-pits": "radiance",
  pergolas: "architectural",
  "garden-rooms": "architectural",
  "privacy-screens": "architectural",
};

export function artMotif({
  department,
  category,
}: {
  department?: string | null;
  category?: string | null;
}): ArtMotif {
  if (category && CATEGORY_MOTIFS[category]) return CATEGORY_MOTIFS[category];
  if (department && DEPARTMENT_MOTIFS[department])
    return DEPARTMENT_MOTIFS[department];
  return "wood-grain";
}

/* -------------------------------------------------------------------------- */
/* Seeding                                                                    */
/* -------------------------------------------------------------------------- */

/** FNV-1a over the slug. Stable across processes, unlike a hash of an object. */
export function artSeed(slug: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, and good enough to place lines with. */
function seeded(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Path helpers                                                               */
/* -------------------------------------------------------------------------- */

/** One decimal place. Keeps the rendered HTML small — these panels are inlined. */
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * A smooth curve through a list of points, using the midpoint-quadratic trick:
 * each point becomes a control point and the curve passes through the midpoints.
 * Straight `L` segments through sampled sine curves look faceted at this scale.
 */
function smooth(points: [number, number][]): string {
  if (points.length < 2) return "";
  const [first, ...rest] = points as [[number, number], ...[number, number][]];
  let d = `M${r1(first[0])} ${r1(first[1])}`;
  for (let i = 0; i < rest.length - 1; i++) {
    const [cx, cy] = rest[i]!;
    const [nx, ny] = rest[i + 1]!;
    d += `Q${r1(cx)} ${r1(cy)} ${r1((cx + nx) / 2)} ${r1((cy + ny) / 2)}`;
  }
  const last = rest.at(-1)!;
  return `${d}L${r1(last[0])} ${r1(last[1])}`;
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`;
}

/** A closed ellipse as two arcs — no <ellipse> element, so everything is a path. */
function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `M${r1(cx - rx)} ${r1(cy)}` +
    `A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(cx + rx)} ${r1(cy)}` +
    `A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(cx - rx)} ${r1(cy)}Z`
  );
}

/** An open arc, swept the short way round. Used for ripples and light. */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
): string {
  const x1 = cx + rx * Math.cos(from);
  const y1 = cy + ry * Math.sin(from);
  const x2 = cx + rx * Math.cos(to);
  const y2 = cy + ry * Math.sin(to);
  const large = Math.abs(to - from) > Math.PI ? 1 : 0;
  return `M${r1(x1)} ${r1(y1)}A${r1(rx)} ${r1(ry)} 0 ${large} 1 ${r1(x2)} ${r1(y2)}`;
}

/** A leaf: two mirrored curves meeting at a tip, plus its midrib. */
function leaf(
  x: number,
  y: number,
  length: number,
  angle: number,
  belly: number,
): string[] {
  const tipX = x + Math.cos(angle) * length;
  const tipY = y + Math.sin(angle) * length;
  const midX = x + Math.cos(angle) * length * 0.5;
  const midY = y + Math.sin(angle) * length * 0.5;
  const nx = Math.cos(angle + Math.PI / 2) * belly;
  const ny = Math.sin(angle + Math.PI / 2) * belly;
  return [
    `M${r1(x)} ${r1(y)}Q${r1(midX + nx)} ${r1(midY + ny)} ${r1(tipX)} ${r1(tipY)}` +
      `Q${r1(midX - nx)} ${r1(midY - ny)} ${r1(x)} ${r1(y)}Z`,
    line(x, y, tipX, tipY),
  ];
}

/* -------------------------------------------------------------------------- */
/* The motifs                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fine wood grain, bowing around a knot. The furniture language: it is the pattern
 * you see looking down at an oak table top, abstracted to line.
 */
function woodGrain(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const count = 13 + Math.floor(rand() * 5);
  const knotX = 110 + rand() * 180;
  const knotY = 150 + rand() * 260;
  const knotR = 24 + rand() * 16;
  const accentAt = Math.floor(rand() * count);

  for (let i = 0; i < count; i++) {
    const base = 16 + (i * (ART_WIDTH - 32)) / (count - 1);
    const phase = rand() * Math.PI * 2;
    const amp = 3 + rand() * 8;
    const points: [number, number][] = [];
    for (let y = -12; y <= ART_HEIGHT + 12; y += 16) {
      let x = base + amp * Math.sin(y / 95 + phase);
      // Grain deflects around a knot: strongest level with it, and falling off
      // with distance so lines far to either side stay straight.
      const fall = Math.exp(-(((y - knotY) / (knotR * 2.6)) ** 2));
      const dx = x - knotX;
      const side = dx >= 0 ? 1 : -1;
      x += (side * fall * knotR * 1.4) / (1 + Math.abs(dx) / knotR);
      points.push([x, y]);
    }
    layers.push({
      d: smooth(points),
      weight: i === accentAt ? "accent" : i % 4 === 0 ? "fine" : "hair",
    });
  }

  layers.push({ d: ellipse(knotX, knotY, knotR * 0.5, knotR), weight: "fine" });
  layers.push({
    d: ellipse(knotX, knotY, knotR * 0.24, knotR * 0.48),
    weight: "hair",
  });
  return layers;
}

/**
 * An architectural elevation: nested arches over a construction grid, with a
 * dimension line. The sketch language of the brief, for kitchens, studies and
 * garden rooms — the places where a piece has to fit a space.
 */
function architectural(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  // 400–436, not 430–490: the accent dimension line sits at `baseline + 34`, and
  // the Description tab crops this canvas square (keeping y 80–480). At the old
  // range the one burnt-orange line in the panel was cropped away on half the
  // products, leaving a grey drawing.
  const baseline = 400 + rand() * 36;

  for (let y = 60; y < baseline; y += 62) {
    layers.push({ d: line(24, y, ART_WIDTH - 24, y), weight: "hair" });
  }
  for (let x = 40; x < ART_WIDTH - 24; x += 72) {
    layers.push({ d: line(x, 40, x, baseline), weight: "hair" });
  }
  layers.push({
    d: line(24, baseline, ART_WIDTH - 24, baseline),
    weight: "fine",
  });

  const arches = 3;
  const outer = 130 + rand() * 26;
  for (let i = 0; i < arches; i++) {
    const width = outer - i * (26 + rand() * 8);
    const cx = ART_WIDTH / 2;
    const spring = baseline - 150 - i * 18;
    layers.push({
      d:
        `M${r1(cx - width)} ${r1(baseline)}L${r1(cx - width)} ${r1(spring)}` +
        `A${r1(width)} ${r1(width * 0.92)} 0 0 1 ${r1(cx + width)} ${r1(spring)}` +
        `L${r1(cx + width)} ${r1(baseline)}`,
      weight: i === 0 ? "fine" : "hair",
    });
  }

  // Dimension line with end ticks — the one thing that makes it read as a drawing
  // rather than a pattern.
  const dim = baseline + 34;
  layers.push({
    d:
      line(ART_WIDTH / 2 - outer, dim, ART_WIDTH / 2 + outer, dim) +
      line(ART_WIDTH / 2 - outer, dim - 8, ART_WIDTH / 2 - outer, dim + 8) +
      line(ART_WIDTH / 2 + outer, dim - 8, ART_WIDTH / 2 + outer, dim + 8),
    weight: "accent",
  });
  return layers;
}

/** Still water: ripples in perspective, with a few surface lines beneath them. */
function water(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const cx = 150 + rand() * 100;
  const cy = 190 + rand() * 120;
  const rings = 6 + Math.floor(rand() * 3);

  let rx = 26 + rand() * 14;
  for (let i = 0; i < rings; i++) {
    layers.push({
      d: ellipse(cx, cy, rx, rx * 0.34),
      weight: i === 1 ? "accent" : i % 2 === 0 ? "fine" : "hair",
    });
    rx += 26 + rand() * 12;
  }

  // Clamped, not just offset from the ripple centre: at a high centre this pushed
  // the last of the five wave lines past y=560 and the bottom third of the panel
  // came back empty — the one outcome this whole file exists to prevent.
  // Clamped so the fifth wave (surface + 4*26) still lands above y=480, which is
  // where the square crop on the Description tab ends. Clamping rather than
  // offsetting from the ripple centre: at a high centre the waves used to fall off
  // the bottom of the canvas entirely and the lower third came back empty.
  const surface = Math.min(cy + 150 + rand() * 60, ART_HEIGHT - 190);
  for (let i = 0; i < 5; i++) {
    const y = surface + i * 26;
    const amp = 5 + rand() * 5;
    const phase = rand() * Math.PI * 2;
    const points: [number, number][] = [];
    for (let x = 12; x <= ART_WIDTH - 12; x += 22)
      points.push([x, y + amp * Math.sin(x / 46 + phase)]);
    layers.push({ d: smooth(points), weight: i % 2 === 0 ? "fine" : "hair" });
  }
  return layers;
}

/** Rising steam over bench slats. Calm organic shapes, for the sauna rooms. */
function steam(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const strands = 5 + Math.floor(rand() * 3);
  // The strands need to stand on the bench slats; without them they read as
  // floating squiggles. 410–435 keeps floor and slats inside the square crop.
  const floor = 410 + rand() * 25;

  for (let i = 0; i < strands; i++) {
    const base = 40 + (i * (ART_WIDTH - 80)) / (strands - 1);
    const phase = rand() * Math.PI * 2;
    const lean = (rand() - 0.5) * 40;
    const top = 40 + rand() * 80;
    const points: [number, number][] = [];
    for (let y = floor; y >= top; y -= 22) {
      const climb = (floor - y) / (floor - top);
      // Amplitude grows as it rises — steam is tight at the source and loose above.
      const amp = 6 + climb * (18 + rand() * 6);
      points.push([base + lean * climb + amp * Math.sin(y / 58 + phase), y]);
    }
    layers.push({
      d: smooth(points),
      weight:
        i === Math.floor(strands / 2) ? "accent" : i % 2 ? "hair" : "fine",
    });
  }

  for (let i = 0; i < 4; i++) {
    const y = floor + 6 + i * 10;
    layers.push({
      d: line(20 + i * 6, y, ART_WIDTH - 20 - i * 6, y),
      weight: "hair",
    });
  }
  return layers;
}

/** Garden linework: planting against a horizon, over paving in perspective. */
function garden(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const horizon = 330 + rand() * 50;

  layers.push({ d: line(0, horizon, ART_WIDTH, horizon), weight: "fine" });

  /* Paving.
   *
   * The first version aimed every board at a single point sitting on the horizon and
   * drew them the whole way to it. Perspective is correct and the picture was wrong:
   * seven lines meeting at a visible point, under a fan of grasses, drew a radar
   * dish. Two corrections — the boards stop short of the vanishing point, so the
   * convergence is implied rather than resolved, and the courses close up as they
   * recede instead of opening out, which is the actual behaviour of a paved terrace
   * and reads as depth rather than as a grid. */
  const vanishX = 140 + rand() * 120;
  const cut = horizon + 34;
  const boards = 7;
  for (let i = 0; i <= boards; i++) {
    const x = -60 + (i * (ART_WIDTH + 120)) / boards;
    const t = (ART_HEIGHT - cut) / (ART_HEIGHT - horizon);
    layers.push({
      d: line(x, ART_HEIGHT, x + (vanishX - x) * t, cut),
      weight: "hair",
    });
  }
  let gap = 74;
  for (let y = ART_HEIGHT - 6; y > cut; y -= gap) {
    layers.push({ d: line(0, y, ART_WIDTH, y), weight: "hair" });
    gap *= 0.74;
  }

  /* Planting.
   *
   * Grasses in two or three clumps rather than scattered evenly across the width —
   * an even scatter is a comb, and a garden is planted in groups. Each clump fans
   * from its own centre. */
  const clumps = 2 + Math.floor(rand() * 2);
  for (let c = 0; c < clumps; c++) {
    const centre = 50 + rand() * (ART_WIDTH - 100);
    const spread = 40 + rand() * 50;
    const tallest = 150 + rand() * 110;
    const blades = 7 + Math.floor(rand() * 5);
    for (let i = 0; i < blades; i++) {
      const offset = (i / (blades - 1) - 0.5) * 2;
      const x = centre + offset * spread;
      // Tallest at the middle of the clump, shorter at its edges.
      const height = tallest * (0.5 + 0.5 * Math.cos((offset * Math.PI) / 2));
      const lean = offset * 34 + (rand() - 0.5) * 18;
      layers.push({
        d:
          `M${r1(x)} ${r1(horizon)}` +
          `Q${r1(x + lean * 0.3)} ${r1(horizon - height * 0.62)} ${r1(x + lean)} ${r1(horizon - height)}`,
        weight: i % 4 === 0 ? "fine" : "hair",
      });
    }
  }

  // A clipped shrub, low and wide, to sit the planting on something.
  const shrubX = 50 + rand() * (ART_WIDTH - 100);
  const shrubR = 46 + rand() * 24;
  for (let i = 0; i < 3; i++)
    layers.push({
      d: arc(
        shrubX,
        horizon,
        shrubR - i * 13,
        (shrubR - i * 13) * 0.92,
        Math.PI,
        0,
      ),
      weight: i === 0 ? "fine" : "hair",
    });

  // One tall stem in accent, standing clear of the clumps.
  const stemX = 36 + rand() * (ART_WIDTH - 72);
  const stemTop = horizon - 220 - rand() * 60;
  layers.push({
    d: `M${r1(stemX)} ${r1(horizon)}Q${r1(stemX + 26)} ${r1((horizon + stemTop) / 2)} ${r1(stemX + 8)} ${r1(stemTop)}`,
    weight: "accent",
  });
  return layers;
}

/**
 * A botanical line drawing: two stems, leaves alternating up them, seed heads.
 *
 * The first version was one thin stem carrying four small leaves, which was emptier
 * than the empty space it was put there to fix — a botanical study fills its plate,
 * and this one has to hold a column beside a page of specifications. So: a second,
 * shorter stem set behind and to one side, more leaves, and leaves large enough to
 * read as leaves at 250px wide.
 */
function botanical(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];

  /** One stem and its foliage. `back` draws the secondary stem more lightly. */
  const draw = (
    baseX: number,
    top: number,
    drift: number,
    leafScale: number,
    back: boolean,
  ) => {
    const stem: [number, number][] = [];
    for (let y = ART_HEIGHT + 10; y >= top; y -= 22) {
      const t = (ART_HEIGHT + 10 - y) / (ART_HEIGHT + 10 - top);
      stem.push([baseX + drift * t + Math.sin(t * 3.1) * 16, y]);
    }
    layers.push({ d: smooth(stem), weight: back ? "hair" : "fine" });

    const count = back
      ? 4 + Math.floor(rand() * 2)
      : 6 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const t = 0.12 + (i / count) * 0.74;
      const index = Math.min(
        stem.length - 1,
        Math.round(t * (stem.length - 1)),
      );
      const [x, y] = stem[index]!;
      // Longest at the base, tapering upward, as a real stem does.
      const length = (118 - i * 9 + rand() * 24) * leafScale;
      const tilt = 0.42 + rand() * 0.3;
      const angle = i % 2 === 0 ? -tilt : Math.PI + tilt;
      const [outline, midrib] = leaf(x, y, length, angle, length * 0.28);
      layers.push({ d: outline!, weight: back ? "hair" : "fine" });
      layers.push({ d: midrib!, weight: "hair" });
    }

    const tip = stem.at(-1)!;
    return tip;
  };

  const mainX = 150 + rand() * 90;
  // 120–160 rather than 78–118: the seed head is drawn 16px above the stem tip, and
  // the square crop was slicing it in half.
  const mainTip = draw(mainX, 120 + rand() * 40, (rand() - 0.5) * 80, 1, false);
  const backX = mainX + (rand() < 0.5 ? -1 : 1) * (70 + rand() * 50);
  draw(backX, 210 + rand() * 70, (rand() - 0.5) * 50, 0.72, true);

  // A seed head rather than a single bud: three ellipses, tightest at the top.
  for (let i = 0; i < 3; i++) {
    layers.push({
      d: ellipse(
        mainTip[0] + (i - 1) * (9 + rand() * 5),
        mainTip[1] - 16 - Math.abs(i - 1) * -8,
        9 + rand() * 4,
        16 + rand() * 7,
      ),
      weight: i === 1 ? "accent" : "fine",
    });
  }
  return layers;
}

/**
 * A pendant throwing light down onto a surface.
 *
 * The first attempt combined concentric arcs with a fan of eleven rays radiating
 * from the same point, which is exactly how you draw a spider's web. Rays crossing
 * arcs make a net; light does not look like a net. Rebuilt as the two edges of a
 * cone, with the pooled light on the surface drawn as flattened ellipses inside it —
 * the same perspective device as the `water` ripples, which is what ties the two
 * motifs to one another.
 */
function radiance(rand: () => number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const cx = 150 + rand() * 100;
  // 140–180: the shade sits `shadeH` above this, and at the old 110–160 the top of
  // the shade was clipped by the square crop, leaving a cone of light with no lamp.
  const cy = 140 + rand() * 40;
  const shadeW = 34 + rand() * 20;
  const shadeH = 26 + rand() * 12;

  // Flex, then the shade as a tapered cone with an open mouth.
  layers.push({ d: line(cx, 0, cx, cy - shadeH), weight: "fine" });
  layers.push({
    d:
      `M${r1(cx - shadeW)} ${r1(cy)}L${r1(cx - shadeW * 0.24)} ${r1(cy - shadeH)}` +
      `L${r1(cx + shadeW * 0.24)} ${r1(cy - shadeH)}L${r1(cx + shadeW)} ${r1(cy)}`,
    weight: "fine",
  });
  layers.push({
    d: ellipse(cx, cy, shadeW, shadeW * 0.26),
    weight: "accent",
  });

  // The cone of light: two edges, wide enough to reach the panel's bottom corners.
  // Pulled up from ART_HEIGHT-70 so the pooled light stays inside the square crop
  // — a cone with no pool at the bottom of it reads as an unfinished drawing.
  const surface = ART_HEIGHT - 110 - rand() * 40;
  const throwWidth = 130 + rand() * 60;
  layers.push({
    d: line(cx - shadeW * 0.8, cy + 6, cx - throwWidth, surface),
    weight: "fine",
  });
  layers.push({
    d: line(cx + shadeW * 0.8, cy + 6, cx + throwWidth, surface),
    weight: "fine",
  });

  // Pooled light, brightest at the centre — flattened ellipses in perspective.
  const pools = 4 + Math.floor(rand() * 2);
  for (let i = 0; i < pools; i++) {
    const rx = throwWidth * (0.3 + (i / pools) * 0.72);
    layers.push({
      d: ellipse(cx, surface, rx, rx * 0.3),
      weight: i % 2 === 0 ? "fine" : "hair",
    });
  }

  // A few soft falls of light between the shade and the surface — three, not eleven,
  // and stopping short of the shade so nothing radiates from a single point.
  for (let i = 0; i < 3; i++) {
    const t = 0.3 + i * 0.22;
    const x = cx + (i - 1) * throwWidth * 0.42;
    layers.push({
      d: line(
        cx + (x - cx) * 0.42,
        cy + (surface - cy) * 0.34,
        x,
        cy + (surface - cy) * (0.72 + t * 0.2),
      ),
      weight: "hair",
    });
  }

  layers.push({ d: line(0, surface, ART_WIDTH, surface), weight: "hair" });
  return layers;
}

const GENERATORS: Record<ArtMotif, (rand: () => number) => ArtLayer[]> = {
  "wood-grain": woodGrain,
  architectural,
  water,
  steam,
  garden,
  botanical,
  radiance,
};

/**
 * The lines to draw for one product. Same slug in, same lines out, always.
 */
export function artPaths(motif: ArtMotif, slug: string): ArtLayer[] {
  return GENERATORS[motif](seeded(artSeed(`${motif}:${slug}`)));
}
