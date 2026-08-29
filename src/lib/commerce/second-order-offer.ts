/**
 * The second-order offer: 10% off, on orders over £100.
 *
 * The brief has always asked for "10% off your second order for creating an
 * account". The first-order version of that idea was withdrawn because it did
 * not survive the margins — Damien: *"the first order discounts dont work when
 * most products are at 20% margin"* — and this one only survives because of
 * the floor he put under it: *"the second order discount is fine, as long as
 * its on orders over £100"*.
 *
 * That floor is protecting the cash rather than the percentage. On a 20%
 * margin a £100 order carries £20 of gross and gives £10 away, which is an
 * acquisition cost that buys a second purchase and the habit after it. The
 * same 10% on a £40 order gives away £4 against £8 and buys a discount
 * hunter. The floor also stops the offer being spent on a single cushion.
 *
 * Everything here is pure, so it can be tested without touching Stripe.
 */

/** Stripe works in minor units. £100.00. */
export const SECOND_ORDER_MINIMUM_PENCE = 10_000;

export const SECOND_ORDER_PERCENT_OFF = 10;

/**
 * A stable coupon id, so one coupon is created and reused rather than a new
 * one accumulating per order in the Stripe dashboard. The per-customer part is
 * the promotion *code*, not the coupon.
 */
export const SECOND_ORDER_COUPON_ID = "kaiku-second-order-10";

/**
 * Whether an order should trigger the offer.
 *
 * Sent after the customer's **first** order, so it is waiting for them when
 * they come back. A guest cannot receive it: the offer is the reward for
 * having an account, and without a user id there is nothing to attach it to or
 * to count orders against.
 */
export function shouldOfferSecondOrderDiscount({
  userId,
  ordersByThisUser,
}: {
  userId: string | null;
  /** How many orders this user has, counting the one just placed. */
  ordersByThisUser: number;
}): boolean {
  return Boolean(userId) && ordersByThisUser === 1;
}

/**
 * A per-customer code that reads like a code rather than a hash.
 *
 * Stripe requires promotion codes to be unique across the account, so the
 * order number is what makes it so. Uppercase because that is how a code gets
 * typed.
 */
export function secondOrderCode(orderNumber: string | null): string {
  const suffix = (orderNumber ?? Date.now().toString(36))
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(-8);
  return `THANKYOU${suffix}`;
}

/** "£100" — for the copy that has to state the floor. */
export function formatMinimum(pence = SECOND_ORDER_MINIMUM_PENCE): string {
  const pounds = pence / 100;
  return `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`;
}
