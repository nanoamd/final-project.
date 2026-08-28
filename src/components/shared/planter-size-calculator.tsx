"use client";

import * as React from "react";

import { planterSize } from "@/lib/tools/planter-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

export function PlanterSizeCalculator() {
  const [diameter, setDiameter] = React.useState("");
  const [depth, setDepth] = React.useState("");
  const [rootBall, setRootBall] = React.useState("");
  const [outdoors, setOutdoors] = React.useState(true);

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = planterSize({
    diameter: num(diameter),
    depth: num(depth),
    rootBall: num(rootBall),
    outdoors,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="planter-diameter">
            Planter width (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">Across the top, inside</p>
          <input
            id="planter-diameter"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="30"
            value={diameter}
            onChange={(event) => setDiameter(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="planter-depth">
            Planter depth (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">Inside, to the base</p>
          <input
            id="planter-depth"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="30"
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="root-ball">
            Plant pot width (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — the nursery pot it came in
          </p>
          <input
            id="root-ball"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="12"
            value={rootBall}
            onChange={(event) => setRootBall(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className={LABEL}>Where will it stand?</legend>
        <div className="mt-3 flex gap-2">
          {(
            [
              [true, "Outside"],
              [false, "Indoors"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setOutdoors(value)}
              aria-pressed={outdoors === value}
              className={`h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors ${
                outdoors === value
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
          {result.litres !== undefined ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                Compost needed
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                about {result.litres} litres
              </p>
            </>
          ) : null}
          {result.recommendedDiameter ? (
            <p className="text-ink mt-4 text-[15px]">
              That plant wants a pot{" "}
              <strong className="font-medium">
                {result.recommendedDiameter.min}–
                {result.recommendedDiameter.max}cm
              </strong>{" "}
              across.
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
        </div>
      ) : (
        <p className="text-muted border-line mt-6 border-t pt-6 text-[14px]">
          Enter the planter&rsquo;s size, or the pot your plant came in.
        </p>
      )}
    </div>
  );
}
