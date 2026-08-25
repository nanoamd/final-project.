"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { toRouterHref } from "@/components/ui/app-link";

/**
 * ⌘K, and the keyboard shortcuts that make HQ feel like a terminal rather than
 * a website with a dark theme.
 *
 * The thing that actually distinguishes a terminal is that you never reach for
 * the mouse: you type where you want to go. So this is the primary navigation,
 * and the left rail is the reminder of what exists.
 *
 * Orders are searchable by number, email or name through a server action rather
 * than by shipping the order list to the browser — HQ holds customer names,
 * addresses and totals, and none of that should be sitting in a client bundle
 * waiting to be filtered.
 */

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  href: string;
  /** Typed after `g` — Bloomberg-ish two-key jumps. */
  shortcut?: string;
}

export interface OrderHit {
  id: string;
  orderNumber: string | null;
  email: string;
  customerName: string | null;
  amountTotal: number;
  stage: string;
}

export function CommandPalette({
  commands,
  searchOrders,
}: {
  commands: PaletteCommand[];
  searchOrders: (query: string) => Promise<OrderHit[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<OrderHit[]>([]);
  const [active, setActive] = React.useState(0);

  const filteredCommands = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(q) ||
        command.hint?.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const rows = React.useMemo(
    () => [
      ...filteredCommands.map((command) => ({
        key: `cmd:${command.id}`,
        href: command.href,
        primary: command.label,
        secondary: command.hint ?? "",
        kind: "Go" as const,
      })),
      ...hits.map((hit) => ({
        key: `order:${hit.id}`,
        href: `/admin/orders/${hit.id}`,
        primary: hit.orderNumber ?? hit.id.slice(0, 8),
        secondary: `${hit.customerName || hit.email} · ${(hit.amountTotal / 100).toFixed(2)} · ${hit.stage}`,
        kind: "Order" as const,
      })),
    ],
    [filteredCommands, hits],
  );

  // Open with ⌘K / Ctrl+K, close with Escape, and support `g`-then-key jumps
  // while nothing is focused.
  React.useEffect(() => {
    let pendingG = false;
    let gTimer: ReturnType<typeof setTimeout> | undefined;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      // Never hijack a key the user is typing into a field.
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (pendingG) {
        const match = commands.find(
          (command) => command.shortcut === event.key.toLowerCase(),
        );
        pendingG = false;
        if (match) {
          event.preventDefault();
          router.push(toRouterHref(match.href));
        }
        return;
      }
      if (event.key.toLowerCase() === "g") {
        pendingG = true;
        // Forgotten second key should not arm the jump forever.
        clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          pendingG = false;
        }, 1200);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(gTimer);
    };
  }, [commands, router]);

  // Order search, debounced. Two characters minimum: one letter matches
  // everything and is not a search.
  //
  // Every setState happens inside the timer callback, never in the effect body
  // — clearing the hits for a too-short query included. Doing it synchronously
  // would cascade a render on every keystroke for no benefit, since the results
  // are about to be replaced anyway.
  React.useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (q.length < 2) {
        setHits([]);
        return;
      }
      searchOrders(q)
        .then((results) => {
          if (!cancelled) setHits(results);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        });
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchOrders]);

  if (!open) return null;

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(toRouterHref(href));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-black/70"
      />
      <div
        className="relative w-full max-w-2xl border"
        style={{
          background: "var(--hq-panel)",
          borderColor: "var(--hq-line)",
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            // Reset the highlight here rather than in an effect on `query`:
            // the highlight belongs to this keystroke, and an effect would
            // fight the arrow keys on the render after one.
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, rows.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const row = rows[active];
              if (row) go(row.href);
            }
          }}
          placeholder="Jump to a page, or search orders by number, name or email…"
          className="hq-num w-full border-0 bg-transparent px-3 py-3 text-[13px] outline-none"
          style={{ borderBottom: "1px solid var(--hq-line)" }}
        />
        <ul className="max-h-[52vh] overflow-y-auto">
          {rows.length === 0 ? (
            <li
              className="px-3 py-4 text-[12px]"
              style={{ color: "var(--hq-faint)" }}
            >
              Nothing matches “{query}”.
            </li>
          ) : (
            rows.map((row, index) => (
              <li key={row.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(row.href)}
                  className="hq-row flex w-full items-center gap-3 px-3 py-2 text-left"
                  style={{
                    background:
                      index === active ? "var(--hq-panel-raised)" : undefined,
                  }}
                >
                  <span
                    className="hq-label w-12 shrink-0"
                    style={{
                      color:
                        row.kind === "Order"
                          ? "var(--hq-accent)"
                          : "var(--hq-faint)",
                    }}
                  >
                    {row.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="hq-num block truncate text-[13px]">
                      {row.primary}
                    </span>
                    {row.secondary ? (
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: "var(--hq-faint)" }}
                      >
                        {row.secondary}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div
          className="flex items-center gap-4 px-3 py-1.5 text-[10px]"
          style={{
            borderTop: "1px solid var(--hq-line)",
            color: "var(--hq-faint)",
          }}
        >
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">g then d · o · i · e for direct jumps</span>
        </div>
      </div>
    </div>
  );
}
