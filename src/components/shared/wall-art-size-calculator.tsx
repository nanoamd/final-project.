"use client";

import * as React from "react";

import { type WallArtPlacement, wallArtSize } from "@/lib/tools/wall-art-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";
const CHIP =
  "h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors";

const PLACEMENTS: { value: WallArtPlacement; label: string }[] = [
  { value: "furniture", label: "Over furniture" },
  { value: "wall", label: "On a bare wall" },
];

export function WallArtSizeCalculator() {
  const [placement, setPlacement] =
    React.useState<WallArtPlacement>("furniture");
  const [measurement, setMeasurement] = React.useState("");
  const [furnitureHeight, setFurnitureHeight] = React.useState("");
  const [isGallery, setIsGallery] = React.useState(false);

  const parsed = Number(measurement);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  const parsedHeight = Number(furnitureHeight);
  const heightValue =
    Number.isFinite(parsedHeight) && parsedHeight > 0
      ? parsedHeight
      : undefined;

  const result = wallArtSize({
    placement,
    isGallery,
    furnitureWidth: placement === "furniture" ? value : undefined,
    furnitureHeight: placement === "furniture" ? heightValue : undefined,
    wallWidth: placement === "wall" ? value : undefined,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <fieldset>
        <legend className={LABEL}>Where is it going?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLACEMENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPlacement(option.value)}
              aria-pressed={placement === option.value}
              className={`${CHIP} ${
                placement === option.value
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="art-measurement">
            {placement === "furniture"
              ? "Width of the furniture (cm)"
              : "Usable wall width (cm)"}
          </label>
          <p className="text-muted mt-1 text-[12px]">
            {placement === "furniture"
              ? "The console, sideboard or sofa it hangs over"
              : "Architrave to corner — not wall to wall"}
          </p>
          <input
            id="art-measurement"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder={placement === "furniture" ? "150" : "220"}
            value={measurement}
            onChange={(event) => setMeasurement(event.target.value)}
          />
        </div>
        {placement === "furniture" ? (
          <div>
            <label className={LABEL} htmlFor="art-furniture-height">
              Height of the furniture (cm)
            </label>
            <p className="text-muted mt-1 text-[12px]">
              Optional — gives you the hanging height too
            </p>
            <input
              id="art-furniture-height"
              className={`${FIELD} mt-2`}
              inputMode="numeric"
              placeholder="80"
              value={furnitureHeight}
              onChange={(event) => setFurnitureHeight(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      <fieldset className="mt-5">
        <legend className={LABEL}>One piece, or a group?</legend>
        <p className="text-muted mt-1 text-[12px]">
          A gallery wall is sized as one shape, not piece by piece
        </p>
        <div className="mt-2 flex gap-2">
          {(
            [
              [false, "One piece"],
              [true, "A gallery wall"],
            ] as const
          ).map(([option, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsGallery(option)}
              aria-pressed={isGallery === option}
              className={`${CHIP} ${
                isGallery === option
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            {isGallery ? "Arrangement width" : "Art width"}
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            {result.widthRange.min}-{result.widthRange.max}cm
          </p>
          <p className="text-ink mt-3 text-[15px]">
            Aim for about{" "}
            <strong className="font-medium">{result.idealWidth}cm</strong>
            {result.bottomEdge ? (
              <>
                , with the bottom edge around{" "}
                <strong className="font-medium">{result.bottomEdge}cm</strong>{" "}
                from the floor.
              </>
            ) : (
              "."
            )}
          </p>
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
        </div>
      ) : (
        <p className="text-muted border-line mt-6 border-t pt-6 text-[14px]">
          Enter the furniture or wall width for the size to shop at and where to
          hang it.
        </p>
      )}
    </div>
  );
}
