"use client";

import * as React from "react";

const STORAGE_KEY = "kaiku-cookie-consent";

export type ConsentStatus = "accepted" | "rejected" | null;

interface CookieConsentContextValue {
  /** `null` until the visitor has made a choice (or before hydration). */
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
}

const CookieConsentContext =
  React.createContext<CookieConsentContextValue | null>(null);

/**
 * Client-side consent state (Context + localStorage), same pattern as
 * use-cart.tsx. Mounted in the root layout so it gates non-essential
 * tracking (Google Analytics) on every route, not just the storefront.
 * Vercel Analytics is deliberately NOT gated by this — it's cookieless by
 * design (Vercel's own docs: no cookies, data auto-discarded after 24h),
 * so it doesn't fall under the same UK PECR/GDPR consent requirement.
 */
export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = React.useState<ConsentStatus>(null);

  React.useEffect(() => {
    // Deliberately starts null (matching the server-rendered output) and
    // syncs from localStorage post-hydration — reading localStorage during
    // render would mismatch SSR output. Same pattern as use-cart.tsx.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "rejected") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(stored);
    }
  }, []);

  const accept = React.useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setStatus("accepted");
  }, []);

  const reject = React.useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "rejected");
    setStatus("rejected");
  }, []);

  return (
    <CookieConsentContext.Provider value={{ status, accept, reject }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = React.useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider",
    );
  }
  return ctx;
}
