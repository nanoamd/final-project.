"use client";

import * as React from "react";

import { patioHeat } from "@/lib/tools/patio-heat";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

const SHELTERS = [
  ["sheltered", "Sheltered"],
  ["partly", "Partly exposed"],
  ["exposed", "Exposed"],
] as const;

const VERDICT: Record<string, { label: string; tone: string }> = {
  enough: { label: "Enough for that area", tone: "text-ink" },
  marginal: { label: "Marginal — fine in still weather", tone: "text-ink" },
  short: { label: "Short for that area", tone: "text-ink" },
};

export function PatioHeatCalculator() {
  const [area, setArea] = React.useState("");
  const [shelter, setShelter] =
    React.useState<(typeof SHELTERS)[number][0]>("partly");
  const [ratingValue, setRatingValue] = React.useState("");
  const [ratingUnit, setRatingUnit] = React.useState<"kw" | "btu">("kw");

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const value = num(ratingValue);
  const result = patioHeat({
    areaSqm: num(area),
    shelter,
    rating: value ? { value, unit: ratingUnit } : undefined,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="area">
            Seating area (m²)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            The part people sit in, not the whole garden
          </p>
          <input
            id="area"
            className={`${FIELD} mt-2`}
            inputMode="decimal"
            placeholder="10"
            value={area}
            onChange={(event) => setArea(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="rating-value">
            A model you are looking at
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Optional — converts both ways
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id="rating-value"
              className={FIELD}
              inputMode="decimal"
              placeholder="50000"
              value={ratingValue}
              onChange={(event) => setRatingValue(event.target.value)}
            />
            <select
              aria-label="Unit"
              className={`${FIELD} w-28`}
              value={ratingUnit}
              onChange={(event) =>
                setRatingUnit(event.target.value as "kw" | "btu")
              }
            >
              <option value="kw">kW</option>
              <option value="btu">BTU/hr</option>
            </select>
          </div>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className={LABEL}>How exposed is the spot?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SHELTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setShelter(key)}
              aria-pressed={shelter === key}
              className={`h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors ${
                shelter === key
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
          {result.needed ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                Output to look for
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                about {result.needed.kw}kW
              </p>
              <p className="text-muted mt-2 text-[14px]">
                That is {result.needed.btu.toLocaleString()} BTU/hr in the units
                gas appliances use.
              </p>
            </>
          ) : null}
          {result.converted && !result.needed ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                That rating is
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.converted.kw}kW
              </p>
            </>
          ) : null}
          {result.verdict ? (
            <p
              className={`mt-4 text-[14px] font-medium ${VERDICT[result.verdict]!.tone}`}
            >
              {VERDICT[result.verdict]!.label}
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
          Enter the seating area, or a rating you want converting.
        </p>
      )}
    </div>
  );
}
