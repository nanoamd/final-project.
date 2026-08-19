import "server-only";

import { siteConfig } from "@/config/site";

import type { OrderEmailData } from "./format";
import type { StageContext } from "./order-stage";

/**
 * A realistic order for previewing emails against.
 *
 * Deliberately a sauna rather than a £19 vase: the sauna is the case where
 * these emails matter (£6,379, four to six weeks, a freight carrier who phones
 * ahead), and it exercises everything at once — a long product name, a lead
 * time, a second line item, a real postal address. An email that reads well
 * here reads well for a candle holder; the reverse is not true.
 *
 * The values are obviously fictional on purpose. Nobody should mistake a
 * preview for a real customer's order.
 */
export const SAMPLE_ORDER: OrderEmailData = {
  orderId: "PREVIEW-0000-0000-0000",
  placedAt: new Date("2026-08-04T11:20:00Z"),
  customerName: "Alex Whitfield",
  customerEmail: "preview@example.com",
  customerPhone: "07700 900000",
  amountTotal: 643700,
  currency: "gbp",
  items: [
    {
      description: "SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna",
      quantity: 1,
      amountTotal: 637900,
      leadTime: "4–6 weeks",
      slug: "saunaplunge-pennine-barrel-6-person-outdoor-sauna",
      sku: "SP-PENNINE-6",
      supplier: "SaunaPlunge (Outdoor Living 365 Ltd)",
      selectedOptions: null,
    },
    {
      description: "Sauna Bucket & Ladle Set in Thermowood",
      quantity: 1,
      amountTotal: 5800,
      leadTime: "3–5 days",
      slug: "sauna-bucket-and-ladle-set",
      sku: "AW-SAUNA-BL",
      supplier: "AW Dropship",
      selectedOptions: null,
    },
  ],
  shippingAddress: {
    name: "Alex Whitfield",
    address: {
      line1: "12 Chiltern Rise",
      line2: null,
      city: "Marlow",
      state: "Buckinghamshire",
      postal_code: "SL7 1AA",
      country: "GB",
    },
  },
  siteUrl: siteConfig.url,
};

/**
 * Tracking and delay details for the stages that need them. Without these a
 * dispatch preview would render the no-tracking variant, which is the less
 * interesting half of that email.
 */
export const SAMPLE_CONTEXT: StageContext = {
  trackingCarrier: "Panther Logistics",
  trackingNumber: "PL4471902GB",
  trackingUrl: "https://www.panther-logistics.co.uk/track/PL4471902GB",
  promisedDispatchDate: "2026-09-15",
  promisedDeliveryDate: "2026-09-22",
  note: "The workshop is running about two weeks behind on cedar cladding, so your delivery window has moved from early to late September.",
};
