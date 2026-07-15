import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { CartProvider } from "@/hooks/use-cart";
import { getNavigation } from "@/lib/sanity/queries/navigation";
import { getSiteSettings } from "@/lib/sanity/queries/site-settings";

/**
 * Chrome for every standard storefront route (header + footer) plus smooth
 * scroll. Lenis is scoped to this group deliberately — its `root` mode
 * hijacks global scroll/wheel behaviour, which would break Sanity Studio's
 * internal fixed-layout panels if it applied at the true app root. `/studio`
 * and `/experience` both live outside this group and get native scrolling.
 *
 * Navigation and site settings are fetched once here and passed down, so
 * both header and footer share a single Sanity read per request.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [nav, settings] = await Promise.all([getNavigation(), getSiteSettings()]);

  return (
    <CartProvider>
      <SmoothScroll>
        <SiteHeader nav={nav} siteName={settings?.siteName} />
        <main className="flex-1">{children}</main>
        <SiteFooter nav={nav} settings={settings} />
      </SmoothScroll>
    </CartProvider>
  );
}
