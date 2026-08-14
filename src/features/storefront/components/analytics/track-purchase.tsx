"use client";

import * as React from "react";

import { type AnalyticsItem, trackPurchase } from "@/lib/analytics/events";

/**
 * Reports the sale, once, from the confirmation page.
 *
 * The one event that decides whether any advertising can be judged. Without it GA4
 * reports sessions and never revenue, and Meta optimises towards clicks because a
 * purchase is the thing it was never told about.
 *
 * Fired from the browser rather than the Stripe webhook on purpose: the webhook runs
 * server-side with no cookies, so a purchase reported from there cannot be attributed
 * to the session, the campaign or the click that produced it — which is the entire
 * point of reporting it. The trade-off is that a customer who closes the tab on the
 * Stripe page before returning is not counted, and the order still exists either way
 * because the webhook is what writes it.
 *
 * De-duplicated on the Stripe session ID, so a refresh does not book a second sale.
 */
export function TrackPurchase({
  orderId,
  items,
  value,
}: {
  orderId: string;
  items: AnalyticsItem[];
  value?: number;
}) {
  React.useEffect(() => {
    if (!orderId) return;
    trackPurchase({ orderId, items, value });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one report per order
  }, [orderId]);

  return null;
}
