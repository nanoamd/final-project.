import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

/**
 * Chrome for every standard storefront route (header + footer) plus smooth
 * scroll. Lenis is scoped to this group deliberately — its `root` mode
 * hijacks global scroll/wheel behaviour, which would break Sanity Studio's
 * internal fixed-layout panels if it applied at the true app root. `/studio`
 * and `/experience` both live outside this group and get native scrolling.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </SmoothScroll>
  );
}
