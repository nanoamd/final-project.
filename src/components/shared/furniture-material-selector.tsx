"use client";

import * as React from "react";

import {
  type Exposure,
  type MaintenanceAppetite,
  type MaterialQuizAnswers,
  type Priority,
  recommendMaterials,
} from "@/lib/furniture-materials";

const EXPOSURE_OPTIONS: { value: Exposure; label: string }[] = [
  { value: "full", label: "Fully exposed to rain and sun" },
  { value: "partial", label: "Partly sheltered — patio cover or pergola" },
  { value: "covered", label: "Mostly covered, or brought in over winter" },
];

const MAINTENANCE_OPTIONS: { value: MaintenanceAppetite; label: string }[] = [
  { value: "none", label: "None — I want to forget it's there" },
  { value: "low", label: "A little — an annual clean or oil is fine" },
  { value: "moderate", label: "I don't mind the upkeep ritual" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low-maintenance", label: "Lowest maintenance" },
  { value: "natural-look", label: "Natural wood look" },
  { value: "budget", label: "Budget-friendly" },
  { value: "lightweight", label: "Lightweight / easy to move" },
  { value: "sustainable", label: "Sustainable materials" },
];

/**
 * Deterministic, no-AI material recommendation quiz. There's no real garden
 * furniture inventory yet, so this doesn't match against products — it
 * teaches the real trade-offs between materials and points toward a
 * category, the same product-agnostic approach used for the buying guides.
 */
export function FurnitureMaterialSelector() {
  const [exposure, setExposure] = React.useState<Exposure | null>(null);
  const [maintenance, setMaintenance] =
    React.useState<MaintenanceAppetite | null>(null);
  const [priorities, setPriorities] = React.useState<Priority[]>([]);
  const [submitted, setSubmitted] = React.useState(false);

  function togglePriority(value: Priority) {
    setPriorities((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  const answers: MaterialQuizAnswers | null =
    exposure && maintenance ? { exposure, maintenance, priorities } : null;

  const results = answers ? recommendMaterials(answers) : [];

  if (submitted && answers) {
    return (
      <div>
        <p className="text-ink font-display text-xl">
          Best matches for your garden
        </p>
        <ul className="mt-6 flex flex-col gap-5">
          {results.map((material) => (
            <li key={material.id} className="border-line rounded-xl border p-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-ink font-display text-[17px]">
                  {material.name}
                </p>
                <span className="text-muted text-[11px] font-medium tracking-[0.1em] uppercase">
                  {material.costTier}
                </span>
              </div>
              <p className="text-graphite mt-2 text-[14px] leading-relaxed">
                {material.summary}
              </p>
              <p className="text-muted mt-3 text-[13px] leading-relaxed">
                {material.tradeOffs}
              </p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-brass mt-8 text-[13px] font-medium"
        >
          ← Start again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          Where will it live?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {EXPOSURE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExposure(opt.value)}
              aria-pressed={exposure === opt.value}
              className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                exposure === opt.value
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          How much maintenance are you happy to do?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {MAINTENANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMaintenance(opt.value)}
              aria-pressed={maintenance === opt.value}
              className={`rounded-lg border px-4 py-3 text-left text-[14px] transition-colors ${
                maintenance === opt.value
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
          What matters most? (pick any)
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => togglePriority(opt.value)}
              aria-pressed={priorities.includes(opt.value)}
              className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
                priorities.includes(opt.value)
                  ? "border-brass text-ink bg-brass/[0.06]"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!answers}
        onClick={() => setSubmitted(true)}
        className="bg-ink hover:bg-ink/90 text-canvas disabled:bg-ink/30 flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors sm:w-auto sm:px-8"
      >
        Show my matches
      </button>
    </div>
  );
}
