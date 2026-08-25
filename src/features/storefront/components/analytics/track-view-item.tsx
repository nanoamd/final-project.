"use client";

import * as React from "react";

import { type AnalyticsItem, trackViewItem } from "@/lib/analytics/events";

/**
 * Reports a product view once, on mount.
 *
 * A client component because the product page is rendered on the server and the tags
 * only exist in the browser. Rendered rather than called inside the summary component
 * so the analytics stay out of the UI code, and so it is obvious from the page which
 * events a page sends.
 *
 * This is the event that makes catalogue retargeting possible — showing somebody the
 * exact piece they looked at rather than a generic advert — and the site sent no such
 * event at all until now.
 */
export function TrackViewItem({ item }: { item: AnalyticsItem }) {
  // The slug identifies the product, so a client-side navigation to a different
  // product re-fires. Depending on `item` itself would re-fire on every re-render.
  React.useEffect(() => {
    trackViewItem(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the product, not the object identity
  }, [item.slug]);

  return null;
}
