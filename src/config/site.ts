/**
 * Single source of truth for brand identity and navigation.
 *
 * The company name is NOT final. Everything user-facing reads from here, so a
 * rename is a one-line change. Treat `siteConfig.name` as the only place the
 * brand string should ever appear.
 */
export const siteConfig = {
  name: "Kaiku",
  legalName: "Project Kaiku Ltd",
  tagline: "Premium home improvement, considered",
  description:
    "Kaiku is a premium home improvement brand — curated architectural products, wellness structures and considered pieces for indoor and outdoor living, chosen with expert guidance and built to last a lifetime.",
  // www, not the bare domain — kaikuhome.com 308-redirects to
  // www.kaikuhome.com in production, so the bare domain was never the
  // actual final URL any page serves from. Every canonical tag, OG tag,
  // JSON-LD url, and sitemap entry is built from this constant, so it needs
  // to match the real serving host exactly, not just redirect to it.
  url: "https://www.kaikuhome.com",
  email: "hello@kaikuhome.com",
} as const;

/**
 * Statutory trading disclosures — the registered company details a UK limited
 * company has to publish on its website.
 *
 * The Companies (Trade and Business Names) rules require a limited company's
 * website to state its registered name, its registered number, the part of the UK
 * it is registered in, and its registered office address. The site was showing
 * "Project Kaiku Ltd" in the copyright line and none of the rest.
 *
 * There is a second, more immediate reason to fix it, and it is why this went in
 * today rather than with the other legal pages. **Wholesale platforms verify
 * retailers by looking at the website.** Ankorstore, Creoate, Geko and every trade
 * account application is a human or a script checking that the applicant is a real
 * registered business trading in the stated category. A site with a company number
 * and a registered office matches against Companies House in seconds; a site
 * without one goes into a manual-review queue, which is indistinguishable from
 * silence. Damien has had no replies from any of them.
 *
 * `companyNumber` is null until Damien supplies it — an invented company number is
 * worse than an absent one, both legally and for a verification check that will
 * look it up. The footer renders whatever is present and omits what is not, so the
 * number appears the moment it is filled in.
 */
export const companyDetails = {
  registeredName: "Project Kaiku Ltd",
  /** Companies House number. **Needed from Damien** — see above. */
  companyNumber: null as string | null,
  registeredIn: "England and Wales",
  address: {
    line1: "16 Isis Way",
    town: "Bourne End",
    postcode: "SL8 5NF",
    country: "United Kingdom",
  },
  /** Below the registration threshold, so there is no number to show. Stated
   *  rather than left blank, because a trade buyer will ask. */
  vatRegistered: false,
} as const;

/** The registered office as one line, for the footer and the contact page. */
export function registeredAddressLine(): string {
  const { line1, town, postcode, country } = companyDetails.address;
  return [line1, town, postcode, country].join(", ");
}

/**
 * The origin to build absolute URLs from — Stripe return URLs, auth redirects,
 * unsubscribe links, the Merchant feed.
 *
 * `siteConfig.url` with `NEXT_PUBLIC_SITE_URL` as an override, rather than the
 * env var alone. Two problems with reading the variable directly, and the second
 * is the one that has been costing money.
 *
 * It was required, so a deploy died without it — over a value that is not a
 * secret and is already hard-coded three lines above for every canonical tag on
 * the site.
 *
 * And having two sources of truth for one origin means they can disagree. If the
 * variable ever said `kaikuhome.com` while the canonical said
 * `www.kaikuhome.com`, Stripe would return a paying customer to a host that
 * 308-redirects — through a redirect, carrying a `session_id`, on the single most
 * fragile step in the funnel. One constant removes that whole class of bug.
 *
 * The override exists so a developer running on localhost gets sent back to
 * localhost after a test checkout. `process.env` directly, written out in full,
 * because Next.js inlines `NEXT_PUBLIC_` values into the browser bundle by
 * literal text substitution — a dynamic lookup would read as undefined there.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavGroup = {
  label: string;
  href: string;
  children?: NavLink[];
};

/** Primary navigation — the top-level bar in the header. */
export const primaryNav: NavGroup[] = [
  {
    label: "Shop",
    href: "/shop",
    children: [
      {
        label: "Saunas & Wellness",
        href: "/shop/outdoor-saunas",
        description: "Cabin, barrel and panoramic saunas for the home.",
      },
      {
        label: "Cold Plunges",
        href: "/shop/cold-plunges",
        description: "Cold therapy tubs for recovery and resilience.",
      },
      {
        label: "Pergolas & Structures",
        href: "/shop/pergolas",
        description: "Louvred and fixed-roof architectural structures.",
      },
      {
        label: "Fire Pits & Heating",
        href: "/shop/fire-pits",
        description: "Fire features and heaters that extend the evening.",
      },
    ],
  },
  { label: "Tools", href: "/tools" },
  { label: "Collections", href: "/shop" },
  { label: "Wellness", href: "/shop/wellness-accessories" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * Collection sub-navigation — the secondary bar shown on shop routes. Labels
 * are brand-coherent (the premium home improvement range) rather than the
 * generic room-based template labels. This is a fallback only: the header
 * prefers Sanity-sourced departments when available.
 */
export const collectionsNav: NavLink[] = [
  { label: "All Collections", href: "/shop" },
  { label: "Saunas & Wellness", href: "/shop/outdoor-saunas" },
  { label: "Cold Plunges", href: "/shop/cold-plunges" },
  { label: "Structures", href: "/shop/pergolas" },
  { label: "Furniture", href: "/shop/garden-furniture" },
  { label: "Fire & Heating", href: "/shop/fire-pits" },
  { label: "Lighting", href: "/shop/lighting" },
  { label: "New In", href: "/shop" },
];

/** Utility actions, right-aligned in the header. */
export const utilityNav: NavLink[] = [
  { label: "Search", href: "/search" },
  { label: "Account", href: "/account" },
];

/** Grouped footer navigation. */
export const footerNav: NavGroup[] = [
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "Outdoor Saunas", href: "/shop/outdoor-saunas" },
      { label: "Cold Plunges", href: "/shop/cold-plunges" },
      { label: "Pergolas", href: "/shop/pergolas" },
      { label: "Fire Pits & Heating", href: "/shop/fire-pits" },
      { label: "Garden Furniture", href: "/shop/garden-furniture" },
    ],
  },
  {
    label: "Discover",
    href: "/learn",
    children: [
      { label: "Buying Guides", href: "/learn" },
      { label: "Journal", href: "/journal" },
      { label: "Compare", href: "/compare" },
      { label: "Guided Buying", href: "/guided-buying" },
      { label: "Inspiration", href: "/inspiration" },
    ],
  },
  {
    label: "Company",
    href: "/about",
    children: [
      { label: "About", href: "/about" },
      { label: "Request a Quote", href: "/quote" },
      { label: "Contact", href: "/contact" },
      { label: "Trade Enquiries", href: "/contact" },
    ],
  },
  {
    label: "Support",
    href: "/faq",
    children: [
      { label: "FAQ", href: "/faq" },
      { label: "Delivery", href: "/delivery" },
      { label: "Returns", href: "/returns" },
      { label: "Warranty", href: "/warranty" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];
