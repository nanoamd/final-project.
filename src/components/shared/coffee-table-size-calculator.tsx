"use client";

import * as React from "react";

import { coffeeTableSize } from "@/lib/tools/coffee-table-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

/**
 * Coffee table sizing, from the shopper's own measurements.
 *
 * Takes the sofa rather than asking what size table they want, for the same
 * reason the mirror tool takes the furniture width: the sofa is what decides
 * the answer, and it is the thing they can go and measure.
 *
 * The third field is the one the ranking blog posts do not have. Two-thirds of
 * the sofa gives a table the right shape; only the floor depth tells you
 * whether it goes in the room.
 */
export function CoffeeTableSizeCalculator() {
  const [sofaLength, setSofaLength] = React.useState("");
  const [sofaSeatHeight, setSofaSeatHeight] = React.useState("");
  const [floorDepth, setFloorDepth] = React.useState("");

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = coffeeTableSize({
    sofaLength: num(sofaLength),
    sofaSeatHeight: num(sofaSeatHeight),
    floorDepth: num(floorDepth),
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="sofa-length">
            Sofa length (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">Arm to arm</p>
          <input
            id="sofa-length"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="180"
            value={sofaLength}
            onChange={(event) => setSofaLength(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="sofa-seat-height">
            Seat height (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — floor to cushion
          </p>
          <input
            id="sofa-seat-height"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="45"
            value={sofaSeatHeight}
            onChange={(event) => setSofaSeatHeight(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="floor-depth">
            Floor in front (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — sofa to what faces it
          </p>
          <input
            id="floor-depth"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="180"
            value={floorDepth}
            onChange={(event) => setFloorDepth(event.target.value)}
          />
        </div>
      </div>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            Shop at
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            {result.idealLength} × {result.idealDepth}cm
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-muted text-[12px]">Length</dt>
              <dd className="text-ink mt-1 text-[14px]">
                {result.lengthRange.min}–{result.lengthRange.max}cm
              </dd>
            </div>
            <div>
              <dt className="text-muted text-[12px]">Depth</dt>
              <dd className="text-ink mt-1 text-[14px]">
                {result.depthRange.min}–
                {result.maxDepthForRoom !== undefined
                  ? Math.max(
                      Math.min(result.depthRange.max, result.maxDepthForRoom),
                      result.depthRange.min,
                    )
                  : result.depthRange.max}
                cm
              </dd>
            </div>
            <div>
              <dt className="text-muted text-[12px]">Height</dt>
              <dd className="text-ink mt-1 text-[14px]">
                {result.heightRange.min}–{result.heightRange.max}cm
              </dd>
            </div>
          </dl>
          {result.notes.length ? (
            <ul className="mt-5 flex flex-col gap-3">
              {result.notes.map((note) => (
                <li
                  key={note.slice(0, 40)}
                  className="text-muted text-[14px] leading-relaxed"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-muted border-line mt-6 border-t pt-6 text-[14px]">
          Enter the length of your sofa to get a size.
        </p>
      )}
    </div>
  );
}
