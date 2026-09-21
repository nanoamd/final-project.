"use client";

import Script from "next/script";

/**
 * The Google Customer Reviews opt-in, on the order confirmation page.
 *
 * This is the mechanism that puts a star rating on a Shopping tile, and the
 * absence of one is a real reason nobody clicks: Google Shopping puts the same
 * product from several merchants side by side, and the tile with stars wins the
 * click from the tile without them. We have no ratings and cannot get any until
 * buyers are asked — which is what this does.
 *
 * It renders a badge after checkout asking the buyer to opt in to a survey
 * Google emails them once the order should have arrived. Their answers build a
 * seller rating. Nothing is shown to the buyer beyond the opt-in, and declining
 * is one click.
 *
 * WHAT IS SENT, AND WHY IT IS FINE. Google needs the buyer's email to send the
 * survey, and the delivery country and estimated date to know when to send it.
 * That is the documented purpose of the integration and it is the buyer's own
 * order. The opt-in is theirs to refuse.
 *
 * Rendered only when an order id and email are both present, because Google
 * rejects the call without them and a half-filled survey request is worse than
 * none.
 *
 * `strategy="afterInteractive"` rather than `beforeInteractive`: the badge is
 * the least urgent thing on a confirmation page, and it must not delay the
 * "thank you" a buyer is waiting to see.
 */
export interface GoogleCustomerReviewsProps {
  merchantId: number;
  orderId: string;
  email: string;
  /** ISO 3166-1 alpha-2, e.g. "GB". */
  deliveryCountry: string;
  /** YYYY-MM-DD. When Google should send the survey. */
  estimatedDeliveryDate: string;
  /** GTINs of what was bought, so reviews attach to products as well as to us. */
  gtins?: string[];
}

export function GoogleCustomerReviews({
  merchantId,
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  gtins = [],
}: GoogleCustomerReviewsProps) {
  if (!orderId || !email || !estimatedDeliveryDate) return null;

  const config = {
    merchant_id: merchantId,
    order_id: orderId,
    email,
    delivery_country: deliveryCountry,
    estimated_delivery_date: estimatedDeliveryDate,
    ...(gtins.length ? { products: gtins.map((gtin) => ({ gtin })) } : {}),
  };

  return (
    <>
      <Script
        id="gcr-platform"
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        strategy="afterInteractive"
      />
      <Script id="gcr-optin" strategy="afterInteractive">
        {`
          window.renderOptIn = function () {
            window.gapi.load('surveyoptin', function () {
              window.gapi.surveyoptin.render(${JSON.stringify(config)});
            });
          };
        `}
      </Script>
    </>
  );
}
