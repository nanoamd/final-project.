"use client";

import * as React from "react";

import { tvUnitSize } from "@/lib/tools/tv-unit-size";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

export function TvUnitSizeCalculator() {
  const [viewingDistance, setViewingDistance] = React.useState("");
  const [tvDiagonal, setTvDiagonal] = React.useState("");

  const parsedDistance = Number(viewingDistance);
  const parsedDiagonal = Number(tvDiagonal);
  const result = tvUnitSize({
    viewingDistanceCm:
      Number.isFinite(parsedDistance) && parsedDistance > 0
        ? parsedDistance
        : undefined,
    tvDiagonalIn:
      Number.isFinite(parsedDiagonal) && parsedDiagonal > 0
        ? parsedDiagonal
        : undefined,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="tv-viewing-distance">
            Seating distance (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">
            From the sofa to where the screen will hang or sit
          </p>
          <input
            id="tv-viewing-distance"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="280"
            value={viewingDistance}
            onChange={(event) => setViewingDistance(event.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tv-diagonal">
            TV size (inches), if you have one
          </label>
          <p className="text-muted mt-1 text-[12px]">
            Leave blank if you&apos;re choosing the TV too
          </p>
          <input
            id="tv-diagonal"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="65"
            value={tvDiagonal}
            onChange={(event) => setTvDiagonal(event.target.value)}
          />
        </div>
      </div>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          {result.recommendedDiagonal ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                TV size for this distance
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.recommendedDiagonal.everydayMinIn}-
                {result.recommendedDiagonal.everydayMaxIn}in
              </p>
            </>
          ) : null}
          {result.unit ? (
            <>
              <p className="text-muted mt-5 text-[12px] tracking-[0.14em] uppercase">
                Unit width needed
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.unit.unitWidthMinCm}-{result.unit.unitWidthMaxCm}cm
              </p>
              <p className="text-ink mt-3 text-[15px]">
                Screen itself is about{" "}
                <strong className="font-medium">
                  {result.unit.screenWidthCm}cm
                </strong>{" "}
                wide.
              </p>
            </>
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
          Enter your seating distance, your TV&apos;s size, or both — either one
          on its own still gives you an answer.
        </p>
      )}
    </div>
  );
}
