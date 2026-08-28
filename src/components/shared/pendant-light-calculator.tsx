"use client";

import * as React from "react";

import { pendantSize } from "@/lib/tools/pendant-light";

const FIELD =
  "border-line focus:border-ink h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] outline-none transition-colors";
const LABEL = "text-ink text-[13px] font-medium";

type Mode = "table" | "room";

/**
 * Pendant sizing, which is two different questions wearing one name.
 *
 * Over a dining table the table decides the size and the tabletop decides the
 * height. In open floor space the room decides the size and headroom decides
 * the height. Asking which situation it is first avoids giving one answer to
 * the other question, which is the mistake most sizing charts make.
 */
export function PendantLightCalculator() {
  const [mode, setMode] = React.useState<Mode>("table");
  const [tableWidth, setTableWidth] = React.useState("");
  const [roomWidth, setRoomWidth] = React.useState("");
  const [roomLength, setRoomLength] = React.useState("");
  const [ceilingHeight, setCeilingHeight] = React.useState("");

  const num = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const result = pendantSize(
    mode === "table"
      ? { tableWidth: num(tableWidth), ceilingHeight: num(ceilingHeight) }
      : {
          roomWidth: num(roomWidth),
          roomLength: num(roomLength),
          ceilingHeight: num(ceilingHeight),
        },
  );

  return (
    <div className="border-line rounded-xl border p-6">
      <fieldset>
        <legend className={LABEL}>Where is it going?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["table", "Over a table"],
              ["room", "In open floor space"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`h-10 rounded-lg border px-4 text-[13px] font-medium transition-colors ${
                mode === value
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {mode === "table" ? (
          <div>
            <label className={LABEL} htmlFor="table-width">
              Table width (cm)
            </label>
            <input
              id="table-width"
              className={`${FIELD} mt-2`}
              inputMode="numeric"
              placeholder="90"
              value={tableWidth}
              onChange={(event) => setTableWidth(event.target.value)}
            />
          </div>
        ) : (
          <>
            <div>
              <label className={LABEL} htmlFor="room-width">
                Room width (cm)
              </label>
              <input
                id="room-width"
                className={`${FIELD} mt-2`}
                inputMode="numeric"
                placeholder="350"
                value={roomWidth}
                onChange={(event) => setRoomWidth(event.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="room-length">
                Room length (cm)
              </label>
              <input
                id="room-length"
                className={`${FIELD} mt-2`}
                inputMode="numeric"
                placeholder="450"
                value={roomLength}
                onChange={(event) => setRoomLength(event.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label className={LABEL} htmlFor="ceiling-height">
            Ceiling height (cm)
          </label>
          <p className="text-muted mt-1 text-[12px]">Optional</p>
          <input
            id="ceiling-height"
            className={`${FIELD} mt-2`}
            inputMode="numeric"
            placeholder="244"
            value={ceilingHeight}
            onChange={(event) => setCeilingHeight(event.target.value)}
          />
        </div>
      </div>

      {result ? (
        <div className="border-line mt-6 border-t pt-6">
          <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
            Fixture diameter
          </p>
          <p className="font-display text-ink mt-2 text-3xl tracking-tight">
            about {result.diameter.ideal}cm
          </p>
          <p className="text-muted mt-2 text-[14px]">
            {result.diameter.min}cm to {result.diameter.max}cm will all work.
            {result.aboveTable
              ? ` Hang it ${result.aboveTable.min}–${result.aboveTable.max}cm above the tabletop.`
              : result.bottomAboveFloor
                ? ` Bottom of the shade around ${result.bottomAboveFloor}cm from the floor.`
                : ""}
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
          {mode === "table"
            ? "Enter the width of the table to get a size."
            : "Enter the room's width and length to get a size."}
        </p>
      )}
    </div>
  );
}
