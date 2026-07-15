"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useCart } from "@/hooks/use-cart";
import { formatPriceExact } from "@/lib/format";
import { createCheckoutSession } from "@/server/actions/checkout";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      await createCheckoutSession(
        items.map((item) => ({
          slug: item.slug,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong — please try again.",
      );
      setCheckingOut(false);
    }
  }

  if (!items.length) {
    return (
      <Container className="py-24 text-center md:py-32">
        <Eyebrow>Basket</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-3xl tracking-tight">
          Your basket is empty
        </h1>
        <p className="text-muted mt-3">Explore the collection to find something for your garden.</p>
        <AppLink
          href="/shop"
          className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
        >
          Explore Collections
        </AppLink>
      </Container>
    );
  }

  return (
    <Container className="py-16 md:py-20">
      <Eyebrow>Basket</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-3xl tracking-tight sm:text-4xl">
        Your basket
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <ul className="divide-line flex flex-col divide-y">
          {items.map((item) => {
            const key = item.slug + JSON.stringify(item.selectedOptions ?? {});
            return (
              <li key={key} className="flex gap-5 py-6 first:pt-0">
                <div className="border-line bg-paper relative size-24 shrink-0 overflow-hidden rounded-lg border">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <AppLink
                        href={`/shop/${item.category}/${item.slug}`}
                        className="text-ink hover:text-brass font-display text-lg transition-colors"
                      >
                        {item.name}
                      </AppLink>
                      {item.selectedOptions ? (
                        <p className="text-muted mt-1 text-[13px]">
                          {Object.entries(item.selectedOptions)
                            .map(([label, value]) => `${label}: ${value}`)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-ink text-[15px] font-medium">
                      {formatPriceExact(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-4">
                    <div className="border-line flex items-center rounded-full border">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity - 1, item.selectedOptions)
                        }
                        className="text-ink/60 hover:text-ink flex size-8 items-center justify-center"
                      >
                        <Minus className="size-3.5" strokeWidth={2} />
                      </button>
                      <span className="text-ink w-6 text-center text-[13px] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity + 1, item.selectedOptions)
                        }
                        className="text-ink/60 hover:text-ink flex size-8 items-center justify-center"
                      >
                        <Plus className="size-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug, item.selectedOptions)}
                      aria-label="Remove item"
                      className="text-muted hover:text-ink flex items-center gap-1.5 text-[12px] transition-colors"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.8} />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-line bg-paper h-fit rounded-xl border p-6">
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink font-medium">{formatPriceExact(subtotal)}</span>
          </div>
          <p className="text-muted mt-2 text-[13px]">
            Tax included. Shipping calculated at checkout.
          </p>
          {error ? <p className="text-brass mt-4 text-[13px]">{error}</p> : null}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="bg-ink hover:bg-ink/90 text-canvas mt-6 flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors disabled:opacity-60"
          >
            {checkingOut ? "Redirecting…" : "Checkout"}
          </button>
        </div>
      </div>
    </Container>
  );
}
