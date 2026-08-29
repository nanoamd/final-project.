"use client";

import * as React from "react";

import {
  type ClockPlacement,
  wallClockSize,
} from "@/lib/tools/wall-clock-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";
const CHIP =
  "h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors";

const PLACEMENTS: { value: ClockPlacement; label: string }[] = [
  { value: "furniture", label: "Over furniture" },
  { value: "wall", label: "On a bare wall" },
  { value: "kitchen", label: "Above kitchen units" },
];

/**
 * The measurement each placement needs, because the constraint changes.
 *
 * Over furniture the clock is sized against the sideboard. On a bare wall it
 * is sized against the usable run. In a kitchen neither applies — the answer
 * is the gap between the top of the cabinets and the ceiling, and that gap
 * wins over anything else in the room.
 */
const PROMPTS: Record<
  ClockPlacement,
  { label: string; hint: string; placeholder: string }
> = {
  furniture: {
    label: "Width of the furniture (cm)",
    hint: "The console, sideboard or mantel it hangs over",
    placeholder: "120",
  },
  wall: {
    label: "Usable wall width (cm)",
    hint: "Architrave to shelf — not corner to corner",
    placeholder: "200",
  },
  kitchen: {
    label: "Gap above the cabinets (cm)",
    hint: "Cabinet top to ceiling",
    placeholder: "60",
  },
};

export function WallClockSizeCalculator() {
  const [placement, setPlacement] = React.useState<ClockPlacement>("furniture");
  const [measurement, setMeasurement] = React.useState("");
  const [read, setRead] = React.useState(true);

  const parsed = Number(measurement);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

  const result = wallClockSize({
    placement,
    read,
    furnitureWidth: placement === "furniture" ? value : undefined,
    wallWidth: placement === "wall" ? value : undefined,
    cabinetGap: placement === "kitchen" ? value : undefined,
  });

  const prompt = PROMPTS[placement];

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
          <label className={LABEL} htmlFor="clock-measurement">
            {prompt.label}
          </label>
          <p className="text-muted mt-1 text-[12px]">{prompt.hint}</p>
          <input
            id="clock-measurement"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder={prompt.placeholder}
            value={measurement}
            onChange={(event) => setMeasurement(event.target.value)}
          />
        </div>
        {placement === "kitchen" ? null : (
          <fieldset>
            <legend className={LABEL}>Will you read it?</legend>
            <p className="text-muted mt-1 text-[12px]">
              A clock you read hangs higher than a picture
            </p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  [true, "Yes, I read it"],
                  [false, "It is decorative"],
                ] as const
              ).map(([option, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRead(option)}
                  aria-pressed={read === option}
                  className={`${CHIP} ${
                    read === option
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-ink hover:border-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            Clock diameter
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            {result.diameterRange.min}–{result.diameterRange.max}cm
          </p>
          <p className="text-ink mt-3 text-[15px]">
            Shop at{" "}
            <strong className="font-medium">
              about {result.idealDiameter}cm
            </strong>
            , hang the centre of the face{" "}
            <strong className="font-medium">
              {result.centreHeight}cm from the floor
            </strong>
            , and leave {result.wallNeeded}cm of wall to it.
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
          Enter {prompt.label.toLowerCase().replace(" (cm)", "")} for the size
          and the hanging height.
        </p>
      )}
    </div>
  );
}
