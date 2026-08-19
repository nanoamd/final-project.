"use client";

import * as React from "react";

/**
 * The live clock on the top bar.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the clock is an
 * external source being subscribed to, which is exactly what this hook is for.
 * It also gives a real server snapshot, so the placeholder is rendered on the
 * server and swapped after hydration without a mismatch — a clock rendered
 * server-side is already wrong by the time it reaches the browser.
 *
 * London time explicitly rather than the viewer's locale. Kaiku's suppliers,
 * carriers and customers are all UK, so "is it still working hours to chase
 * someone" is a UK question regardless of where Damien is sitting.
 */

/** Seconds, not milliseconds: the snapshot must be stable within one render. */
function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, 1000);
  return () => clearInterval(timer);
}

function getSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}

/** 0 means "not yet known", which renders the width-reserving placeholder. */
function getServerSnapshot(): number {
  return 0;
}

export function HqClock() {
  const seconds = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (seconds === 0) {
    // Same character count as the real thing, so the top bar does not jump.
    return (
      <span className="hq-num text-[11px]" style={{ color: "var(--hq-faint)" }}>
        --- -- --- --:--:--
      </span>
    );
  }

  const now = new Date(seconds * 1000);
  const date = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  });
  const time = now.toLocaleTimeString("en-GB", {
    hour12: false,
    timeZone: "Europe/London",
  });

  return (
    <span className="hq-num text-[11px]" style={{ color: "var(--hq-dim)" }}>
      {date} {time} <span style={{ color: "var(--hq-faint)" }}>LON</span>
    </span>
  );
}
