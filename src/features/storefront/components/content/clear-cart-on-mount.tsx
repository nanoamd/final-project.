"use client";

import * as React from "react";

import { useCart } from "@/hooks/use-cart";

/** Empties the basket once, after a successful Stripe redirect. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  React.useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
