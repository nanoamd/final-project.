"use client";

import { Lock, Minus, Plus, RotateCcw, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { companyDetails, siteConfig, tradingAddressLine } from "@/config/site";
import { BasketAddOns } from "@/features/storefront/components/cart/basket-add-ons";
import { useCart } from "@/hooks/use-cart";
import { trackBeginCheckout } from "@/lib/analytics/events";
import { formatPriceExact } from "@/lib/format";
import { createCheckoutSession } from "@/server/actions/checkout";
import {
  type BasketDeliveryAnswer,
  checkDeliverability,
} from "@/server/actions/deliverability";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  /**
   * Optional, and passed to Stripe as `customer_email`.
   *
   * Thirteen baskets were abandoned between 28 September and 22 October, worth
   * about £2,539, and twelve of the thirteen recorded no email — because the
   * row is written from Stripe's expired session and those visitors left
   * Stripe's page before typing anything. Asking here is the only point at
   * which there is anything to capture.
   *
   * It also pre-fills Stripe's own email field, so the visitor types one thing
   * fewer on the page they are already hesitating on. Never required: a
   * mandatory field in front of a payment button is a cost paid by every
   * customer to recover some of the ones who leave.
   */
  const [email, setEmail] = React.useState("");
  /**
   * Optional delivery postcode, and what the server makes of it.
   *
   * Asked here because this is the last page Kaiku controls. Stripe Checkout
   * accepts every GB postcode — there is no allow-list to configure — and a
   * two-person delivery service does not reach Northern Ireland, the Isle of
   * Man, the Outer Hebrides, Orkney, Shetland or the remoter Highlands and
   * Argyll. Without this, an order for a 63kg bookcase to a BT address is
   * taken, paid and then unwound.
   *
   * Optional for the same reason the email field is: a required field in
   * front of a payment button is a cost paid by every customer. The server
   * refuses the impossible combination either way — see
   * server/actions/checkout.ts — so leaving it blank delays the news to the
   * Checkout press rather than skipping the check.
   */
  const [postcode, setPostcode] = React.useState("");
  const [answer, setAnswer] = React.useState<BasketDeliveryAnswer | null>(null);
  const blocked = answer?.verdict.deliverable === false;

  const slugKey = items.map((item) => item.slug).join(",");

  React.useEffect(() => {
    if (!slugKey) return;
    let cancelled = false;
    /**
     * Asked with whatever postcode has been typed, including none.
     *
     * One effect rather than two because the answer carries both facts and
     * they come from one query: the arrival window, which does not depend on
     * the address and so must appear without one, and the postcode verdict,
     * which only says anything once there is a postcode to judge. A short or
     * empty entry is a deliverable verdict by construction — see
     * checkBasketDeliverability — so there is nothing to special-case here,
     * and nothing to set synchronously in the effect body.
     *
     * Debounced because it fires on keystrokes, and the answer for "IV2" is
     * not the answer for "IV27". The last one typed is the only one counted.
     */
    const timer = setTimeout(() => {
      checkDeliverability(slugKey.split(","), postcode.trim())
        .then((result) => {
          if (!cancelled) setAnswer(result);
        })
        .catch(() => {
          // Silent: this is a courtesy, and createCheckoutSession runs the
          // same test where it cannot fail open.
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [postcode, slugKey]);

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    // Reported before the redirect, because once Stripe has the visitor this page is
    // gone and nothing else on our side sees the attempt.
    trackBeginCheckout(
      items.map((item) => ({
        slug: item.slug,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      })),
    );
    try {
      await createCheckoutSession(
        items.map((item) => ({
          slug: item.slug,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        })),
        email,
        postcode,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong — please try again.",
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
        <p className="text-muted mt-3">
          Explore the collection to find something for your space.
        </p>
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
    // pb-24 reserves room for the fixed mobile checkout bar below, so it
    // never overlaps the last item in a long basket — lg:pb-0 since that
    // bar is mobile-only (the summary card's own Checkout button is
    // already reachable in the single right-hand column at lg).
    <Container className="py-16 pb-24 md:py-20 lg:pb-20">
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
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
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
                          updateQuantity(
                            item.slug,
                            item.quantity - 1,
                            item.selectedOptions,
                          )
                        }
                        className="text-ink/60 hover:text-ink flex size-10 items-center justify-center"
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
                          updateQuantity(
                            item.slug,
                            item.quantity + 1,
                            item.selectedOptions,
                          )
                        }
                        className="text-ink/60 hover:text-ink flex size-10 items-center justify-center"
                      >
                        <Plus className="size-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.slug, item.selectedOptions)
                      }
                      aria-label="Remove item"
                      className="text-muted hover:text-ink -my-[13px] flex items-center gap-1.5 py-[13px] text-[12px] transition-colors"
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
            <span className="text-ink font-medium">
              {formatPriceExact(subtotal)}
            </span>
          </div>
          <p className="text-muted mt-2 text-[13px]">
            Free UK delivery, included in the price.
          </p>
          {/* The arrival estimate, on the page where someone is deciding to
              pay. It was previously stated on the product page and then not
              again until the confirmation email, so a basket with a 3-4 week
              piece in it read as though it were about to be dispatched.
              Always the slowest line in the basket — see slowestWindow. */}
          {answer?.window ? (
            <p className="text-graphite mt-3 flex items-start gap-2 text-[13px]">
              <Truck
                className="text-ink/50 mt-px size-[15px] shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <span>
                {items.length > 1 ? "Everything arrives" : "Arrives"} in{" "}
                {answer.window}
              </span>
            </p>
          ) : null}
          <div className="mt-6">
            <label
              htmlFor="checkout-email"
              className="text-ink block text-[13px] font-medium"
            >
              Email <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="checkout-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border-line bg-canvas text-ink placeholder:text-muted/70 focus:border-ink mt-2 h-11 w-full rounded-lg border px-3 text-[15px] transition-colors outline-none"
            />
            <p className="text-muted mt-2 text-[13px]">
              We&rsquo;ll send your order confirmation here. You can also leave
              it blank and enter it on the next page.
            </p>
          </div>
          <div className="mt-5">
            <label
              htmlFor="checkout-postcode"
              className="text-ink block text-[13px] font-medium"
            >
              Delivery postcode{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="checkout-postcode"
              type="text"
              inputMode="text"
              autoComplete="postal-code"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. BT1 5GS"
              aria-describedby="postcode-note"
              aria-invalid={blocked || undefined}
              className="border-line bg-canvas text-ink placeholder:text-muted/70 focus:border-ink mt-2 h-11 w-full rounded-lg border px-3 text-[15px] uppercase transition-colors outline-none"
            />
            <p id="postcode-note" className="text-muted mt-2 text-[13px]">
              Some larger pieces travel on a two-person service that
              doesn&rsquo;t reach every part of the UK. We&rsquo;ll check before
              you pay rather than after.
            </p>
          </div>
          {/* Shown in place of a refund. The same test runs server-side in
              createCheckoutSession, so a blank or edited postcode does not
              get an impossible order through — it only moves the news to the
              Checkout press. */}
          {blocked && answer?.verdict.message ? (
            <div
              role="alert"
              className="border-brass/40 bg-brass/5 mt-5 rounded-lg border p-4"
            >
              <p className="text-ink text-[13px] leading-relaxed">
                {answer.verdict.message}
              </p>
            </div>
          ) : null}
          {error ? (
            <p className="text-brass mt-4 text-[13px]">{error}</p>
          ) : null}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut || blocked}
            className="bg-ink hover:bg-ink/90 text-canvas mt-6 flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors disabled:opacity-60"
          >
            {checkingOut ? "Redirecting…" : "Checkout"}
          </button>
          <div className="text-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" strokeWidth={1.5} aria-hidden />
              Secure checkout
            </span>
            {/* Linked, not just asserted. "14-day returns" was plain text and
                the policy it refers to was four tab-clicks and a scroll away
                on the product page — a buyer deciding on £1,500 hunts for
                returns hardest, and the words were here without the door. */}
            <AppLink
              href="/returns"
              className="hover:text-ink -my-[13px] flex items-center gap-1.5 py-[13px] underline decoration-[0.5px] underline-offset-4 transition-colors"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
              14-day returns
            </AppLink>
            <AppLink
              href="/delivery"
              className="hover:text-ink -my-[13px] flex items-center gap-1.5 py-[13px] underline decoration-[0.5px] underline-offset-4 transition-colors"
            >
              <Truck className="size-3.5" strokeWidth={1.5} aria-hidden />
              Delivery
            </AppLink>
          </div>

          {/**
           * Who the buyer is actually contracting with.
           *
           * The Consumer Contracts Regulations 2013 (Sch. 2 (b), (c)) require
           * the trader's identity and geographic address to be given **before
           * the consumer is bound**, and the Ecommerce Regulations want it
           * "easily, directly and permanently accessible". It was on /terms
           * and /contact and in the order emails, and nowhere on the basket —
           * the last page Kaiku controls before Stripe takes the card.
           *
           * Deliberately small and at the bottom: it is a disclosure, not a
           * selling point. But on a sole-trader shop a named person with a
           * real address is also the strongest trust signal available, and
           * four screens of the buying journey were carrying none of it.
           */}
          <p className="text-muted mt-5 text-[11px] leading-relaxed">
            {siteConfig.name} is a trading name of {companyDetails.traderName}.{" "}
            {tradingAddressLine()}.{" "}
            <AppLink
              href="/terms"
              className="hover:text-ink underline decoration-[0.5px] underline-offset-4 transition-colors"
            >
              Terms
            </AppLink>
          </p>
        </div>
      </div>

      {/* The one page where the decision to buy is already made and the only
          open question is how much. Same-supplier pieces under £100 ride the
          carriage already being paid, which is what makes them worth showing
          here and nowhere else — see the component for the full reasoning. */}
      <BasketAddOns slugs={items.map((item) => item.slug)} />

      {/* Mobile only — on a long basket the summary card above ends up
          below every item in the stacked single-column layout, burying
          Checkout a full scroll away. Keeps it reachable at all times. */}
      <div className="border-line bg-canvas/95 fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t p-3 backdrop-blur-md lg:hidden">
        <p className="text-ink shrink-0 pl-1 text-[15px] font-medium">
          {formatPriceExact(subtotal)}
        </p>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingOut || blocked}
          className="bg-ink hover:bg-ink/90 text-canvas flex h-12 flex-1 items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors disabled:opacity-60"
        >
          {checkingOut ? "Redirecting…" : "Checkout"}
        </button>
      </div>
    </Container>
  );
}
