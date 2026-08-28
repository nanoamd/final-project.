"use client";

import * as React from "react";

import { diningSpace } from "@/lib/tools/dining-space";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

const FIT: Record<string, string> = {
  comfortable: "Fits comfortably",
  tight: "Fits, at tight clearance",
  no: "Does not fit with usable clearance",
};

export function DiningSpaceCalculator() {
  const [spaceWidth, setSpaceWidth] = React.useState("");
  const [spaceLength, setSpaceLength] = React.useState("");
  const [tableWidth, setTableWidth] = React.useState("");
  const [tableLength, setTableLength] = React.useState("");
  const [againstWall, setAgainstWall] = React.useState(false);

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = diningSpace({
    spaceWidth: num(spaceWidth),
    spaceLength: num(spaceLength),
    tableWidth: num(tableWidth),
    tableLength: num(tableLength),
    againstWall,
  });

  return (
    <div className="border-line rounded-xl border p-6">
      <p className={LABEL}>The space</p>
      <div className="mt-2 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-muted text-[12px]" htmlFor="space-width">
            Width (cm)
          </label>
          <input
            id="space-width"
            className={`${FIELD} mt-1`}
            inputMode="numeric"
            placeholder="400"
            value={spaceWidth}
            onChange={(event) => setSpaceWidth(event.target.value)}
          />
        </div>
        <div>
          <label className="text-muted text-[12px]" htmlFor="space-length">
            Length (cm)
          </label>
          <input
            id="space-length"
            className={`${FIELD} mt-1`}
            inputMode="numeric"
            placeholder="500"
            value={spaceLength}
            onChange={(event) => setSpaceLength(event.target.value)}
          />
        </div>
      </div>

      <p className={`${LABEL} mt-6`}>A table you are considering (optional)</p>
      <div className="mt-2 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-muted text-[12px]" htmlFor="table-w">
            Table width (cm)
          </label>
          <input
            id="table-w"
            className={`${FIELD} mt-1`}
            inputMode="numeric"
            placeholder="90"
            value={tableWidth}
            onChange={(event) => setTableWidth(event.target.value)}
          />
        </div>
        <div>
          <label className="text-muted text-[12px]" htmlFor="table-l">
            Table length (cm)
          </label>
          <input
            id="table-l"
            className={`${FIELD} mt-1`}
            inputMode="numeric"
            placeholder="180"
            value={tableLength}
            onChange={(event) => setTableLength(event.target.value)}
          />
        </div>
      </div>

      <label className="mt-6 flex items-center gap-3 text-[14px]">
        <input
          type="checkbox"
          className="border-line size-4 rounded"
          checked={againstWall}
          onChange={(event) => setAgainstWall(event.target.checked)}
        />
        <span className="text-ink">
          One long side sits against a wall or fence
        </span>
      </label>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          {result.maxTable ? (
            <>
              <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
                Largest table that fits
              </p>
              <p className="font-display text-ink mt-2 text-3xl tracking-tight">
                {result.maxTable.width} × {result.maxTable.length}cm
              </p>
            </>
          ) : null}
          {result.seats ? (
            <p className="text-ink mt-4 text-[15px]">
              That table seats{" "}
              <strong className="font-medium">
                {result.seats.comfortable}
              </strong>{" "}
              comfortably
              {result.seats.maximum > result.seats.comfortable
                ? `, ${result.seats.maximum} at a squeeze`
                : ""}
              .
            </p>
          ) : null}
          {result.fit ? (
            <p className="text-ink mt-2 text-[15px] font-medium">
              {FIT[result.fit]}
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
          Enter the space you have, a table you are considering, or both.
        </p>
      )}
    </div>
  );
}
