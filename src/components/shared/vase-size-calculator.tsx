"use client";

import * as React from "react";

import { type VaseNeck, vaseSize } from "@/lib/tools/vase-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";
const CHIP =
  "h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors";

const NECKS: { value: VaseNeck; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide mouth" },
];

export function VaseSizeCalculator() {
  const [vaseHeight, setVaseHeight] = React.useState("");
  const [stemLength, setStemLength] = React.useState("");
  const [neck, setNeck] = React.useState<VaseNeck>("medium");

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = vaseSize({
    vaseHeight: num(vaseHeight),
    stemLength: num(stemLength),
    neck,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="vase-height">
            Vase height (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Leave blank if you are shopping for one
          </p>
          <input
            id="vase-height"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="30"
            value={vaseHeight}
            onChange={(event) => setVaseHeight(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="stem-length">
            Stem length (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — the flowers as bought
          </p>
          <input
            id="stem-length"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="60"
            value={stemLength}
            onChange={(event) => setStemLength(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className={LABEL}>How wide is the neck?</legend>
        <p className="text-muted mt-1 text-[12px]">
          This decides how many stems it takes to look full
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {NECKS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setNeck(option.value)}
              aria-pressed={neck === option.value}
              className={`${CHIP} ${
                neck === option.value
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          {result.suggestedVaseHeight ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                Vase height
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.suggestedVaseHeight.min}–
                {result.suggestedVaseHeight.max}
                cm
              </p>
            </>
          ) : (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                Buy stems at
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.stemsToBuy.min}–{result.stemsToBuy.max}cm
              </p>
            </>
          )}
          <p className="text-ink mt-3 text-[15px]">
            Expect{" "}
            <strong className="font-medium">
              {result.stemCount.min}–{result.stemCount.max} stems
            </strong>{" "}
            to fill it, standing{" "}
            <strong className="font-medium">
              {result.arrangementHeight.min}–{result.arrangementHeight.max}cm
            </strong>{" "}
            above the surface.
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
          Enter the height of the vase, or the length of the stems you have.
        </p>
      )}
    </div>
  );
}
