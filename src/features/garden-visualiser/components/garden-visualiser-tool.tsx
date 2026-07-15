"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { visualiseGarden } from "@/server/actions/garden-visualiser";

const STYLES = [
  { key: "sauna", label: "Add a sauna" },
  { key: "hotTub", label: "Add a hot tub" },
  { key: "decking", label: "Add decking & lighting" },
] as const;

export function GardenVisualiserTool() {
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [preset, setPreset] = React.useState<string>("sauna");
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onGenerate() {
    if (!photo) {
      setError("Upload a photo of your garden first.");
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const response = await visualiseGarden(photo, preset);
      if (!response.ok || !response.imageDataUrl) {
        setError(response.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(response.imageDataUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="border-line bg-paper rounded-xl border p-8">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Your garden photo
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="text-muted mt-1 text-[14px]"
          />
        </label>

        <div className="mt-6 flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Style
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style.key}
                type="button"
                onClick={() => setPreset(style.key)}
                className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
                  preset === style.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={onGenerate}
          disabled={pending || !photo}
          className="mt-6"
        >
          {pending ? "Generating…" : "Visualise my garden"}
        </Button>

        {error ? <p className="text-muted mt-4 text-[14px]">{error}</p> : null}
      </div>

      {(photo || result) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {photo ? (
            <div>
              <p className="text-muted mb-2 text-[12px] font-medium tracking-[0.08em] uppercase">
                Before
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not a static asset */}
              <img
                src={photo}
                alt="Your garden"
                className="border-line aspect-square w-full rounded-lg border object-cover"
              />
            </div>
          ) : null}
          {result ? (
            <div>
              <p className="text-muted mb-2 text-[12px] font-medium tracking-[0.08em] uppercase">
                After
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset */}
              <img
                src={result}
                alt="Your garden, visualised"
                className="border-line aspect-square w-full rounded-lg border object-cover"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
