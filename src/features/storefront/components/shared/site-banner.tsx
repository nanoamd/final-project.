import { PromoBanner } from "@/components/shared/promo-banner";

/**
 * The one site-wide banner message, in one place.
 *
 * It was written inline in both `home-page.tsx` and `shop-all.tsx` — the two
 * surfaces the homepage and every shop page render through — and a copy
 * change to one and not the other is exactly the kind of drift this codebase
 * has been burned by before (see the email catalogue's own history). This
 * exists so there is one string to change, not two to remember to change
 * together.
 */
export function SiteBanner() {
  return (
    <PromoBanner>
      The UK&rsquo;s most helpful home store
      <span className="hidden sm:inline">
        {" "}
        — 12 free tools and 14 buying guides, and free UK delivery
      </span>
    </PromoBanner>
  );
}
