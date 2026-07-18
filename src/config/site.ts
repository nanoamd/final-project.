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
  url: "https://example.com",
  email: "hello@example.com",
} as const;

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
