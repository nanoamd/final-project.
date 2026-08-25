import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { CartProvider } from "@/hooks/use-cart";
import { RecentlyViewedProvider } from "@/hooks/use-recently-viewed";
import { SavedProductsProvider } from "@/hooks/use-saved-products";
import { getCategories } from "@/lib/sanity/queries/category";
import { getDepartments } from "@/lib/sanity/queries/department";
import { getNavigation } from "@/lib/sanity/queries/navigation";
import { getSiteSettings } from "@/lib/sanity/queries/site-settings";
import { subscribeToNewsletter } from "@/server/actions/newsletter";

import { AdminBar } from "./admin-bar";

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
export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [nav, settings, departments, categories] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
    getDepartments(),
    getCategories(),
  ]);

  return (
    <CartProvider>
      <SavedProductsProvider>
        <RecentlyViewedProvider>
          <SmoothScroll>
            <SiteHeader
              nav={nav}
              siteName={settings?.siteName}
              rooms={departments}
              categories={categories}
            />
            <main className="flex-1">{children}</main>
            <SiteFooter
              nav={nav}
              settings={settings}
              onNewsletterSubscribe={subscribeToNewsletter}
            />
            {/* Renders nothing at all unless the visitor is an authorised
                admin — see the note in admin-bar.tsx about why it is resolved
                server-side rather than hidden with CSS. */}
            <AdminBar />
          </SmoothScroll>
        </RecentlyViewedProvider>
      </SavedProductsProvider>
    </CartProvider>
  );
}
