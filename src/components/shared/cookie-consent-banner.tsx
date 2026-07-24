"use client";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

/**
 * UK PECR/GDPR requires consent before non-essential (analytics/marketing)
 * cookies run — Google Analytics sets real persistent cookies, so it stays
 * off until the visitor accepts here. See use-cookie-consent.tsx for why
 * Vercel Analytics isn't gated by this same choice.
 */
export function CookieConsentBanner() {
  const { status, accept, reject } = useCookieConsent();

  if (status !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="bg-basalt text-canvas fixed inset-x-0 bottom-0 z-50 border-t border-white/10"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <p className="text-canvas/75 max-w-2xl text-[13px] leading-relaxed">
          We use cookies to understand how Kaiku is used and improve it. You can
          accept or reject non-essential cookies —{" "}
          <AppLink href="/cookies" className="text-brass underline">
            read our Cookie Policy
          </AppLink>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={reject}
            className={buttonVariants({ variant: "onDark", size: "sm" })}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={accept}
            className={buttonVariants({ variant: "accent", size: "sm" })}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
