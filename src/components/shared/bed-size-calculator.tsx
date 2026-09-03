"use client";

import * as React from "react";

import {
  BED_LENGTHS_CM,
  BED_WIDTHS_CM,
  bedSize,
  type BedSizeName,
} from "@/lib/tools/bed-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";
const CHIP =
  "h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors";

function sizeLabel(size: BedSizeName): string {
  return size === "superking"
    ? "Super King"
    : size[0]!.toUpperCase() + size.slice(1);
}

export function BedSizeCalculator() {
  const [wallWidth, setWallWidth] = React.useState("");
  const [roomDepth, setRoomDepth] = React.useState("");
  const [footIsWalkway, setFootIsWalkway] = React.useState(false);

  const parsedWall = Number(wallWidth);
  const parsedDepth = Number(roomDepth);
  const result = bedSize({
    wallWidth:
      Number.isFinite(parsedWall) && parsedWall > 0 ? parsedWall : undefined,
    roomDepth:
      Number.isFinite(parsedDepth) && parsedDepth > 0 ? parsedDepth : undefined,
    footIsWalkway,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="bed-wall-width">
            Width of the wall (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            The wall the headboard will sit against
          </p>
          <input
            id="bed-wall-width"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="300"
            value={wallWidth}
            onChange={(event) => setWallWidth(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="bed-room-depth">
            Depth of the room (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            From that wall to the far side of the room
          </p>
          <input
            id="bed-room-depth"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="350"
            value={roomDepth}
            onChange={(event) => setRoomDepth(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className={LABEL}>
          Is the foot of the bed also a walkway?
        </legend>
        <p className="text-muted mt-1 text-[12px]">
          The path to a door or wardrobe, say — not just floor you occasionally
          cross
        </p>
        <div className="mt-2 flex gap-2">
          {(
            [
              [false, "No, it's clear"],
              [true, "Yes, people pass through"],
            ] as const
          ).map(([option, optionLabel]) => (
            <button
              key={optionLabel}
              type="button"
              onClick={() => setFootIsWalkway(option)}
              aria-pressed={footIsWalkway === option}
              className={`${CHIP} ${
                footIsWalkway === option
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
                {BED_WIDTHS_CM[result.largestThatFits]} x{" "}
                {BED_LENGTHS_CM[result.largestThatFits]}cm
              </strong>{" "}
              mattress size.
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
          Enter the wall width and room depth for the largest bed that fits with
          room to walk round it.
        </p>
      )}
    </div>
  );
}
