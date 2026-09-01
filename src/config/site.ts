/**
 * Single source of truth for brand identity and navigation.
 *
 * The company name is NOT final. Everything user-facing reads from here, so a
 * rename is a one-line change. Treat `siteConfig.name` as the only place the
 * brand string should ever appear.
 */
export const siteConfig = {
  name: "Kaiku",
  // Kaiku trades as a sole trader, so the legal name is the trader's own name.
  // See the note on `companyDetails` for why this is not "Project Kaiku Ltd".
  legalName: "Damien McCormack",
  tagline: "The UK's most helpful home store",
  description:
    "Kaiku is the UK's most helpful home store — premium furniture and decor, garden structures and outdoor living, and wellness structures like saunas and cold plunges, chosen with expert guidance and built to last a lifetime.",
  // www, not the bare domain — kaikuhome.com 308-redirects to
  // www.kaikuhome.com in production, so the bare domain was never the
  // actual final URL any page serves from. Every canonical tag, OG tag,
  // JSON-LD url, and sitemap entry is built from this constant, so it needs
  // to match the real serving host exactly, not just redirect to it.
  url: "https://www.kaikuhome.com",
  email: "hello@kaikuhome.com",
} as const;

/**
 * Statutory trading disclosures.
 *
 * **Kaiku trades as a sole trader, not a limited company.** The site previously
 * stated "Project Kaiku Ltd is a company registered in England and Wales" with no
 * company number, which was the worst of both worlds: unverifiable to a customer,
 * and a claim that has to be true.
 *
 * That claim mattered less for shopper trust than for the three gatekeepers the
 * business depends on, all of which verify business identity rather than take it on
 * faith:
 *
 *   - **Stripe** checks business details at onboarding. A limited company that does
 *     not exist fails; a sole trader onboarding against a site that says "Ltd" is a
 *     mismatch on the exact field being checked.
 *   - **Google Merchant Centre** treats misrepresentation as grounds for
 *     suspension, not a warning — and free Shopping listings are the launch plan.
 *   - **Trade suppliers** verify applicants against the register. Damien has had
 *     silence from several, and this was the likeliest cause.
 *
 * Trading as a sole trader is entirely legal and costs nothing, which is why it was
 * chosen over spending the available £100 on incorporation: the £100 goes to
 * advertising instead, and incorporating becomes a decision for when revenue allows.
 *
 * What the law requires of a sole trader selling online is the trader's own name,
 * a geographic address and contact details — all present below and rendered in the
 * footer. If Kaiku does incorporate later, restore `registeredName`,
 * `companyNumber` and `registeredIn` and the footer wording changes with them.
 */
export const companyDetails = {
  /**
   * The trading name, and the name of the person behind it.
   *
   * **Damien: check the spelling of `traderName` matches your legal name exactly** —
   * it has to match what Stripe and Merchant Centre are given, or the verification
   * mismatch this change exists to remove comes straight back.
   */
  tradingName: "Kaiku",
  traderName: "Damien McCormack",
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

/** The trading address as one line, for the footer and the contact page. */
export function tradingAddressLine(): string {
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
 * are brand-coherent (the premium home store range) rather than the
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
