import { AppLink } from "@/components/ui/app-link";

/**
 * Where to go next from a policy or information page.
 *
 * Measured: `/about`, `/faq`, `/delivery`, `/returns`, `/warranty`, `/terms`
 * and `/privacy` rendered **zero links between them**. Every one is in the
 * footer of every page on the site, so each receives link equity from all 900+
 * of them and passes none on — and a person who has just read the returns
 * policy, which is the thing a £1,500 buyer reads hardest, is left with the
 * browser back button.
 *
 * The pairs below are what someone reading that page actually wants next, not
 * a link block for its own sake: delivery and returns answer each other,
 * warranty follows returns, and every one of them ends at a way to ask a
 * human. Where a page has nothing useful to point at, it gets nothing.
 */
const ONWARD: Record<string, { href: string; label: string }[]> = {
  about: [
    { href: "/shop", label: "Browse the collection" },
    { href: "/learn", label: "Buying guides" },
    { href: "/contact", label: "Get in touch" },
  ],
  contact: [
    { href: "/faq", label: "Frequently asked questions" },
    { href: "/delivery", label: "Delivery" },
    { href: "/returns", label: "Returns & refunds" },
  ],
  delivery: [
    { href: "/returns", label: "Returns & refunds" },
    { href: "/faq", label: "Frequently asked questions" },
    { href: "/contact", label: "Ask about your order" },
  ],
  returns: [
    { href: "/delivery", label: "Delivery" },
    { href: "/warranty", label: "Warranty" },
    { href: "/contact", label: "Start a return" },
  ],
  warranty: [
    { href: "/returns", label: "Returns & refunds" },
    { href: "/contact", label: "Make a claim" },
  ],
  terms: [
    { href: "/privacy", label: "Privacy policy" },
    { href: "/returns", label: "Returns & refunds" },
    { href: "/contact", label: "Get in touch" },
  ],
  privacy: [
    { href: "/cookies", label: "Cookie policy" },
    { href: "/terms", label: "Terms & conditions" },
    { href: "/contact", label: "Get in touch" },
  ],
  cookies: [
    { href: "/privacy", label: "Privacy policy" },
    { href: "/terms", label: "Terms & conditions" },
  ],
  faq: [
    { href: "/delivery", label: "Delivery" },
    { href: "/returns", label: "Returns & refunds" },
    { href: "/contact", label: "Ask us directly" },
  ],
};

export function PageOnwardLinks({ slug }: { slug: string }) {
  const links = ONWARD[slug];
  if (!links?.length) return null;

  return (
    <nav aria-label="Related pages" className="border-line mt-14 border-t pt-8">
      <h2 className="text-muted text-[12px] font-medium tracking-[0.14em] uppercase">
        Related
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <AppLink
              href={link.href}
              className="border-line hover:border-ink text-graphite hover:text-ink inline-flex min-h-11 items-center rounded-full border px-4 text-[13px] transition-colors"
            >
              {link.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
