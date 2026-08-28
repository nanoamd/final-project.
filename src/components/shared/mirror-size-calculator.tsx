"use client";

import * as React from "react";

import { mirrorSize } from "@/lib/tools/mirror-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

/**
 * Mirror sizing, from the shopper's own measurements.
 *
 * Deliberately takes the furniture's width rather than asking what size mirror
 * they want: the width of the thing it hangs over is the measurement that
 * decides the answer, and it is the one they can go and take.
 */
export function MirrorSizeCalculator() {
  const [furnitureWidth, setFurnitureWidth] = React.useState("");
  const [furnitureHeight, setFurnitureHeight] = React.useState("");
  const [mirrorHeight, setMirrorHeight] = React.useState("");

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = mirrorSize({
    furnitureWidth: num(furnitureWidth),
    furnitureHeight: num(furnitureHeight),
    mirrorHeight: num(mirrorHeight),
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="furniture-width">
            Furniture width (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Console, sideboard or mantel
          </p>
          <input
            id="furniture-width"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="120"
            value={furnitureWidth}
            onChange={(event) => setFurnitureWidth(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="furniture-height">
            Its height (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">Optional — floor to top</p>
          <input
            id="furniture-height"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="80"
            value={furnitureHeight}
            onChange={(event) => setFurnitureHeight(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="mirror-height">
            Mirror height (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — if you have one in mind
          </p>
          <input
            id="mirror-height"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="70"
            value={mirrorHeight}
            onChange={(event) => setMirrorHeight(event.target.value)}
          />
        </div>
      </div>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            Aim for
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            {result.idealWidth}cm wide
          </p>
          <p className="text-muted mt-2 text-[14px]">
            Anything from {result.widthRange.min}cm to {result.widthRange.max}cm
            will look right.
          </p>
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
          Enter the width of the furniture it will hang over to get a size.
        </p>
      )}
    </div>
  );
}
