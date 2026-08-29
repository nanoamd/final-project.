import "server-only";

import {
  SECOND_ORDER_COUPON_ID,
  SECOND_ORDER_MINIMUM_PENCE,
  SECOND_ORDER_PERCENT_OFF,
  secondOrderCode,
} from "@/lib/commerce/second-order-offer";

import { getStripe } from "./client";

/**
 * Ensures the second-order coupon exists, then issues one personal promotion
 * code against it.
 *
 * **Why a fixed coupon and a fresh code every time.** The discount itself —
 * 10%, £100 minimum — is one policy and belongs to one Stripe object, reused
 * by every customer. Stripe enforces uniqueness on the *code* a shopper types,
 * not on the coupon behind it, so each customer still needs their own code:
 * without one, the first customer to receive it could hand it to anyone.
 *
 * **Why the minimum lives on the promotion code and not the coupon.** A
 * `Coupon` in Stripe has no minimum-spend field — only a `PromotionCode` does,
 * via `restrictions.minimum_amount`. Put the percentage on the coupon because
 * that is shared policy, and the spend floor on the code because that is where
 * Stripe actually lets you set it.
 *
 * **Why `max_redemptions: 1` and no `customer` binding.** Binding a promotion
 * code to a specific Stripe `Customer` would need one to exist first, and
 * checkout here has never created Customer objects — it passes
 * `customer_email` to a payment-mode session. Rather than add that just for
 * this, the code is capped at one redemption and emailed to one address
 * privately, which is the same trust boundary every other emailed code in
 * retail relies on.
 */
export async function issueSecondOrderCode(
  orderNumber: string | null,
): Promise<{ code: string; minimum: number; percentOff: number } | null> {
  const stripe = getStripe();

  const couponExists = await stripe.coupons
    .retrieve(SECOND_ORDER_COUPON_ID)
    .then(() => true)
    .catch(() => false);

  if (!couponExists) {
    try {
      await stripe.coupons.create({
        id: SECOND_ORDER_COUPON_ID,
        percent_off: SECOND_ORDER_PERCENT_OFF,
        duration: "once",
        name: "Kaiku second order",
      });
    } catch (error) {
      // Two orders completing at the same moment can both find the coupon
      // missing and both try to create it; one of those creates loses to
      // Stripe's own uniqueness check. Rather than pattern-match Stripe's
      // error shape to tell that case apart from a real failure, check
      // whether the coupon exists now — which is the fact that actually
      // matters, however it came to be true.
      const existsNow = await stripe.coupons
        .retrieve(SECOND_ORDER_COUPON_ID)
        .then(() => true)
        .catch(() => false);
      if (!existsNow) {
        console.error(
          "[second-order-offer] could not create the shared coupon:",
          error,
        );
        return null;
      }
    }
  }

  // Deterministic from the order number rather than random. That is what
  // makes this idempotent for free: if Stripe retries the webhook delivery
  // for this same order (it retries on any non-2xx for up to three days),
  // this create call fails on Stripe's own uniqueness check the second time,
  // this returns null, and the caller sends no duplicate email — without
  // either side needing to track "have I already done this for this order".
  const code = secondOrderCode(orderNumber);

  try {
    await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: SECOND_ORDER_COUPON_ID },
      code,
      max_redemptions: 1,
      restrictions: {
        minimum_amount: SECOND_ORDER_MINIMUM_PENCE,
        minimum_amount_currency: "gbp",
      },
    });
  } catch (error) {
    console.error(
      `[second-order-offer] could not create promotion code ${code} (a duplicate here is expected on a Stripe webhook retry, and correctly suppresses a second email):`,
      error,
    );
    return null;
  }

  return {
    code,
    minimum: SECOND_ORDER_MINIMUM_PENCE,
    percentOff: SECOND_ORDER_PERCENT_OFF,
  };
}
