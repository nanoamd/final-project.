"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { ActivityItem } from "@/server/storefront/recent-activity";

/**
 * The live activity note in the corner of every page.
 *
 * Damien asked for the widget every shop has — somebody's name, something they
 * just bought, a green light to say it is happening now. This is that widget,
 * with one difference: nothing in it is invented. The green light means the
 * feed is reading real records, so it has to be reading real records.
 *
 * Where the items come from, and why they are real, is in
 * `src/server/storefront/recent-activity.ts`. Two things follow from it here:
 *
 *   - With nothing true to say the component renders null. No skeleton, no
 *     placeholder, no "be the first". An empty shop is quiet.
 *   - Orders and arrivals are worded so they cannot be mistaken for each
 *     other. "Laura in Leeds bought" and "Just added" are different sentences
 *     because they are different facts.
 *
 * Ten seconds, as asked: six visible, four clear. A note that never leaves is
 * furniture and stops being read.
 */

const VISIBLE_MS = 6000;
const HIDDEN_MS = 4000;
const DISMISS_KEY = "kaiku:activity-feed-dismissed";

/**
 * There is deliberately no timestamp on the card.
 *
 * Damien asked for the time removed entirely rather than made vaguer, and that
 * is the better of the two anyway. A relative time is the part of a feed like
 * this that most often turns into a lie — "4 minutes ago" is a claim about
 * right now, and it stays on screen whether or not it is still true. Saying
 * nothing about when makes no claim at all, so the sentence is only ever as
 * true as the record behind it.
 *
 * `at` is still carried on the item, because the feed is ordered by it.
 */

/**
 * Whether this visitor closed the feed, held outside React.
 *
 * `sessionStorage` cannot be read while rendering on the server, and reading
 * it in an effect means a first paint that assumes the wrong answer. A tiny
 * external store is what `useSyncExternalStore` exists for: the server
 * snapshot is "dismissed", so the server renders nothing and the widget is
 * never in the HTML, and the browser corrects it on hydration.
 */
const dismissal = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    dismissal.listeners.add(listener);
    return () => dismissal.listeners.delete(listener);
  },
  read(): boolean {
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Private browsing, or storage blocked. Show it; it just will not stay
      // closed between pages.
      return false;
    }
  },
  dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Closed for this page at least.
    }
    dismissal.listeners.forEach((listener) => listener());
  },
};

function sentence(item: ActivityItem): string {
  if (item.kind === "arrival") return "Just added";
  if (item.name && item.place) return `${item.name} in ${item.place} bought`;
  if (item.name) return `${item.name} bought`;
  if (item.place) return `Someone in ${item.place} bought`;
  return "Someone bought";
}

export function RecentActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const dismissed = useSyncExternalStore(
    dismissal.subscribe,
    dismissal.read,
    () => true,
  );

  useEffect(() => {
    if (dismissed) return;
    const controller = new AbortController();
    fetch("/api/recent-activity", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: ActivityItem[] }) => setItems(data.items ?? []))
      .catch(() => {
        // A feed that cannot load is a feed that shows nothing. It is an
        // ornament; it does not get to report its own failure to a shopper.
      });
    return () => controller.abort();
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || items.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const step = (visible: boolean) => {
      setShown(visible);
      timer = setTimeout(
        () => {
          if (visible) {
            step(false);
          } else {
            setIndex((current) => (current + 1) % items.length);
            step(true);
          }
        },
        visible ? VISIBLE_MS : HIDDEN_MS,
      );
    };
    // A short beat before the first one, so it arrives after the page settles
    // rather than competing with it.
    const start = setTimeout(() => step(true), 2500);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, [dismissed, items.length]);

  const item = items[index];
  const label = useMemo(() => (item ? sentence(item) : ""), [item]);

  if (dismissed || !item) return null;

  return (
    <div
      // z-30 keeps it under the mobile buy bar (z-40) and the cookie banner
      // (z-50). If they ever overlap, the button that takes money wins.
      className="pointer-events-none fixed bottom-20 left-3 z-30 max-w-[min(20rem,calc(100vw-1.5rem))] lg:bottom-6 lg:left-6"
      aria-live="polite"
    >
      <div
        className={`border-line bg-canvas/95 pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all duration-500 motion-reduce:transition-none ${
          shown
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <span className="relative mt-1 flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.6)]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-ink text-[13px] leading-snug">
            <span className="font-medium">{label}</span>{" "}
            {item.href ? (
              // A plain anchor rather than next/link: typed routes reject a
              // string href, and these are built from catalogue data.
              <a
                href={item.href}
                className="underline decoration-1 underline-offset-2"
              >
                {item.product}
              </a>
            ) : (
              item.product
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dismissal.dismiss()}
          aria-label="Hide recent activity"
          className="text-muted hover:text-ink -mt-1 -mr-1 shrink-0 rounded p-1 text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}
