"use client";

import { Analytics } from "@vercel/analytics/next";

import { siteConfig } from "@/config/site";

/**
 * Vercel Web Analytics, recording the live site only.
 *
 * On 21 August the preview deployment took 2,842 visits in an hour — a single
 * URL, no referrers, 99% bounce. Preview domains are found through
 * certificate-transparency logs and crawled within hours of a first deploy, and
 * every one of those hits landed in the same figures as real customers. The
 * bounce rate went to 99% and stayed there, because 2,842 bot visits drown
 * out a day's worth of genuine ones.
 *
 * `beforeSend` returning null drops an event before it is recorded, so from
 * here on only kaikuhome.com is measured. Preview deployments still work
 * exactly as before; they are simply not counted.
 *
 * **This cannot repair what was already recorded.** Vercel Analytics has no
 * delete, and the 21 August figures are permanent. It stops the next one.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const host = new URL(event.url).hostname;
          const production = new URL(siteConfig.url).hostname;
          // The bare apex as well as www, so a redirect hop still counts.
          const allowed = new Set([
            production,
            production.replace(/^www\./, ""),
          ]);
          return allowed.has(host) ? event : null;
        } catch {
          // An unparseable URL is not something to record either.
          return null;
        }
      }}
    />
  );
}
