"use client";

import * as React from "react";

import {
  SOFA_WIDTH_RANGE_CM,
  sofaSize,
  type SofaSizeName,
} from "@/lib/tools/sofa-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";
const CHIP =
  "h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors";

function sizeLabel(size: SofaSizeName): string {
  if (size === "twoSeater") return "2-seater";
  if (size === "threeSeater") return "3-seater";
  return "4-seater";
}

export function SofaSizeCalculator() {
  const [wallWidth, setWallWidth] = React.useState("");
  const [roomDepth, setRoomDepth] = React.useState("");
  const [frontIsWalkway, setFrontIsWalkway] = React.useState(false);

  const parsedWall = Number(wallWidth);
  const parsedDepth = Number(roomDepth);
  const result = sofaSize({
    wallWidth:
      Number.isFinite(parsedWall) && parsedWall > 0 ? parsedWall : undefined,
    roomDepth:
      Number.isFinite(parsedDepth) && parsedDepth > 0 ? parsedDepth : undefined,
    frontIsWalkway,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="sofa-wall-width">
            Width of the wall (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            The wall the sofa&apos;s back will sit against
          </p>
          <input
            id="sofa-wall-width"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="280"
            value={wallWidth}
            onChange={(event) => setWallWidth(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="sofa-room-depth">
            Depth in front of it (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            To the coffee table, walkway or opposite wall
          </p>
          <input
            id="sofa-room-depth"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="220"
            value={roomDepth}
            onChange={(event) => setRoomDepth(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className={LABEL}>Is the space in front also a walkway?</legend>
        <p className="text-muted mt-1 text-[12px]">
          The path to a door or the rest of the room — not just floor you
          occasionally cross
        </p>
        <div className="mt-2 flex gap-2">
          {(
            [
              [false, "No, just a coffee table"],
              [true, "Yes, people pass through"],
            ] as const
          ).map(([option, optionLabel]) => (
            <button
              key={optionLabel}
              type="button"
              onClick={() => setFrontIsWalkway(option)}
              aria-pressed={frontIsWalkway === option}
              className={`${CHIP} ${
                frontIsWalkway === option
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {optionLabel}
            </button>
          ))}
        </div>
      </fieldset>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            Largest size that fits
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            {result.largestThatFits
              ? sizeLabel(result.largestThatFits)
              : "None, at this size"}
          </p>
          {result.largestThatFits ? (
            <p className="text-ink mt-3 text-[15px]">
              <strong className="font-medium">
                {SOFA_WIDTH_RANGE_CM[result.largestThatFits].min}-
                {SOFA_WIDTH_RANGE_CM[result.largestThatFits].max}cm
              </strong>{" "}
              wide is the usual range for this size.
            </p>
          ) : null}
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
          <div className="mt-5 flex flex-wrap gap-2">
            {result.sizes.map((s) => (
              <span
                key={s.size}
                className={`${CHIP} inline-flex items-center ${
                  s.fits
                    ? "border-line text-ink"
                    : "border-line text-muted line-through opacity-60"
                }`}
              >
                {sizeLabel(s.size)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted border-line mt-6 border-t pt-6 text-[14px]">
          Enter the wall width and the depth in front for the largest straight
          sofa that fits with room to get past it.
        </p>
      )}
    </div>
  );
}
