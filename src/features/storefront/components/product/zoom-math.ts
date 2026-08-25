/**
 * The arithmetic behind the image viewer's zoom and pan.
 *
 * Pulled out of the component because it is the part that can be quietly wrong:
 * an offset with the sign flipped zooms away from the point you clicked, and a
 * clamp that is off by a factor of two lets the photograph be dragged off screen
 * and lost with no way back. Neither throws, neither shows up in a typecheck, and
 * both are obvious in a test.
 *
 * The transform these describe is `translate(x, y) scale(z)`. CSS applies that
 * right to left — scale first, then translate — so the translation is in the
 * parent's unscaled pixels, which is what makes the maths below readable.
 */

export interface Offset {
  x: number;
  y: number;
}

export interface StageSize {
  width: number;
  height: number;
}

/**
 * Turns -0 into 0.
 *
 * `-1 * 0` is -0 in JavaScript, which is equal to 0 for every comparison but
 * prints as "-0px" in a transform and reads as a bug when you are debugging one.
 */
function zeroed(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * How far the image may be moved before its edge crosses the stage edge.
 *
 * At zoom 1 the answer is zero: there is nothing to pan, so the image stays
 * centred and a stray drag cannot nudge it.
 */
export function panLimit(stage: StageSize, zoom: number): Offset {
  const scale = Math.max(0, zoom - 1);
  return {
    x: (scale * stage.width) / 2,
    y: (scale * stage.height) / 2,
  };
}

/** Holds an offset inside the pan limits for a given zoom. */
export function clampOffset(
  offset: Offset,
  stage: StageSize,
  zoom: number,
): Offset {
  const limit = panLimit(stage, zoom);
  return {
    x: zeroed(Math.max(-limit.x, Math.min(limit.x, offset.x))),
    y: zeroed(Math.max(-limit.y, Math.min(limit.y, offset.y))),
  };
}

/**
 * The offset that brings the point clicked to the middle of the stage.
 *
 * A point sitting `d` pixels from the centre lands at `d * zoom` once scaled, so
 * translating by `-d * zoom` puts it back in the middle. Clamped, because a click
 * near a corner asks for more pan than exists and would otherwise reveal a strip
 * of empty background.
 */
export function zoomToPoint({
  point,
  stage,
  zoom,
}: {
  /** Click position relative to the stage's top-left corner. */
  point: Offset;
  stage: StageSize;
  zoom: number;
}): Offset {
  const fromCentreX = point.x - stage.width / 2;
  const fromCentreY = point.y - stage.height / 2;
  return clampOffset(
    { x: -fromCentreX * zoom, y: -fromCentreY * zoom },
    stage,
    zoom,
  );
}
