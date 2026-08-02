"use client";

import * as React from "react";

import type { SavedProduct } from "@/types/saved-products";

const STORAGE_KEY = "kaiku-recently-viewed";
const MAX_ITEMS = 12;

interface RecentlyViewedContextValue {
  items: SavedProduct[];
  record: (item: SavedProduct) => void;
}

const RecentlyViewedContext =
  React.createContext<RecentlyViewedContextValue | null>(null);

/**
 * Browsing history (Context + localStorage) — same SSR-safe hydration
 * pattern as use-saved-products.tsx: starts empty to match the
 * server-rendered page, syncs from localStorage post-hydration. Most
 * recently viewed first, deduped by slug, capped at MAX_ITEMS so the list
 * never grows unbounded across a long session.
 */
export function RecentlyViewedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = React.useState<SavedProduct[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage — start from an empty list.
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/unavailable (e.g. private browsing) — still works for
      // the session, just won't persist across reloads.
    }
  }, [items, hydrated]);

  const record = React.useCallback((item: SavedProduct) => {
    setItems((prev) => {
      // Already the most recent entry — skip the update entirely rather
      // than writing an identical array back on every render/navigation.
      if (prev[0]?.slug === item.slug) return prev;
      const withoutItem = prev.filter((i) => i.slug !== item.slug);
      return [item, ...withoutItem].slice(0, MAX_ITEMS);
    });
  }, []);

  const value = React.useMemo<RecentlyViewedContextValue>(
    () => ({ items, record }),
    [items, record],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = React.useContext(RecentlyViewedContext);
  if (!ctx) {
    throw new Error(
      "useRecentlyViewed must be used within a RecentlyViewedProvider",
    );
  }
  return ctx;
}
