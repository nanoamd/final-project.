"use client";

import * as React from "react";

import type { SavedProduct } from "@/types/saved-products";

const STORAGE_KEY = "kaiku-saved-products";

interface SavedProductsContextValue {
  items: SavedProduct[];
  isSaved: (slug: string) => boolean;
  toggle: (item: SavedProduct) => void;
  remove: (slug: string) => void;
  count: number;
}

const SavedProductsContext =
  React.createContext<SavedProductsContextValue | null>(null);

/**
 * "Save for later" state (Context + localStorage) — same shape as
 * use-cart.tsx, including the SSR-safe hydration pattern: starts empty to
 * match server-rendered output, syncs from localStorage post-hydration.
 * No server persistence, matching the cart's own guest-friendly design.
 */
export function SavedProductsProvider({
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

  const isSaved = React.useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  const toggle = React.useCallback((item: SavedProduct) => {
    setItems((prev) =>
      prev.some((i) => i.slug === item.slug)
        ? prev.filter((i) => i.slug !== item.slug)
        : [...prev, item],
    );
  }, []);

  const remove = React.useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const value = React.useMemo<SavedProductsContextValue>(
    () => ({ items, isSaved, toggle, remove, count: items.length }),
    [items, isSaved, toggle, remove],
  );

  return (
    <SavedProductsContext.Provider value={value}>
      {children}
    </SavedProductsContext.Provider>
  );
}

export function useSavedProducts(): SavedProductsContextValue {
  const ctx = React.useContext(SavedProductsContext);
  if (!ctx) {
    throw new Error(
      "useSavedProducts must be used within a SavedProductsProvider",
    );
  }
  return ctx;
}
