"use client";

import * as React from "react";

import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "kaiku-cart";

/** Distinguishes cart lines for the same product with different options. */
function lineKey(slug: string, selectedOptions?: Record<string, string>): string {
  return selectedOptions ? `${slug}::${JSON.stringify(selectedOptions)}` : slug;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (slug: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (
    slug: string,
    quantity: number,
    selectedOptions?: Record<string, string>,
  ) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = React.createContext<CartContextValue | null>(null);

/**
 * Client-side cart state (Context + localStorage) — lives in src/hooks
 * (not a feature folder) because the site header's basket badge needs it
 * and `layout-ui` is not allowed to import `feature` per the architecture
 * boundaries in eslint.config.mjs. No server persistence: prices are
 * re-validated server-side at checkout, so a stale localStorage price is
 * never trusted for payment.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Deliberately starts empty (matching the server-rendered output) and
    // syncs from localStorage post-hydration, not during render — reading
    // localStorage during render would mismatch SSR output. A
    // useSyncExternalStore-based rewrite would need its own snapshot cache
    // to keep JSON.parse results referentially stable across calls, which
    // trades this rule warning for a real risk of infinite-loop bugs.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage — start from an empty cart.
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/unavailable (e.g. private browsing) — cart still works
      // for the session, it just won't persist across reloads.
    }
  }, [items, hydrated]);

  const addItem = React.useCallback<CartContextValue["addItem"]>((item, quantity = 1) => {
    setItems((prev) => {
      const key = lineKey(item.slug, item.selectedOptions);
      const existing = prev.find((i) => lineKey(i.slug, i.selectedOptions) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.slug, i.selectedOptions) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = React.useCallback<CartContextValue["removeItem"]>(
    (slug, selectedOptions) => {
      const key = lineKey(slug, selectedOptions);
      setItems((prev) => prev.filter((i) => lineKey(i.slug, i.selectedOptions) !== key));
    },
    [],
  );

  const updateQuantity = React.useCallback<CartContextValue["updateQuantity"]>(
    (slug, quantity, selectedOptions) => {
      const key = lineKey(slug, selectedOptions);
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => lineKey(i.slug, i.selectedOptions) !== key));
        return;
      }
      setItems((prev) =>
        prev.map((i) => (lineKey(i.slug, i.selectedOptions) === key ? { ...i, quantity } : i)),
      );
    },
    [],
  );

  const clear = React.useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = React.useMemo<CartContextValue>(
    () => ({ items, addItem, removeItem, updateQuantity, clear, count, subtotal }),
    [items, addItem, removeItem, updateQuantity, clear, count, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
