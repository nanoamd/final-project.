"use client";

import Script from "next/script";

import { env } from "@/env";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

/**
 * Google Analytics 4 — renders nothing until NEXT_PUBLIC_GA_MEASUREMENT_ID is
 * set (Vercel env vars), so it's safe to ship ahead of actually having a GA4
 * property. `afterInteractive` loads it once the page is interactive rather
 * than blocking the initial render. Also gated on cookie consent — GA sets
 * real persistent cookies, so it must not run until the visitor accepts.
 */
export function GoogleAnalytics() {
  const measurementId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { status } = useCookieConsent();
  if (!measurementId || status !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
