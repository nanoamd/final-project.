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
  tagline: "Garden wellness, considered",
  description:
    "A considered approach to garden wellness. Outdoor saunas, cold plunge and recovery — chosen with expert guidance, built to last a lifetime.",
  url: "https://example.com",
  email: "hello@example.com",
  phone: "+44 (0)20 0000 0000",
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

/** Primary navigation. Designed to expand as categories are added. */
export const primaryNav: NavGroup[] = [
  {
    label: "Shop",
    href: "/shop",
    children: [
      {
        label: "Outdoor Saunas",
        href: "/shop/outdoor-saunas",
        description: "Cabin, barrel and panoramic saunas for the garden.",
      },
      {
        label: "Sauna Heaters",
        href: "/shop/sauna-heaters",
        description: "Electric and wood-burning heaters, correctly sized.",
      },
      {
        label: "Cold Plunge",
        href: "/shop/cold-plunge",
        description: "Cold therapy tubs for recovery and resilience.",
      },
      {
        label: "Chillers",
        href: "/shop/chillers",
        description: "Water chillers that hold a precise temperature.",
      },
    ],
  },
  { label: "Learn", href: "/learn" },
  { label: "Compare", href: "/compare" },
  { label: "Guided Buying", href: "/guided-buying" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "About", href: "/about" },
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
      { label: "Sauna Heaters", href: "/shop/sauna-heaters" },
      { label: "Cold Plunge", href: "/shop/cold-plunge" },
      { label: "Chillers", href: "/shop/chillers" },
    ],
  },
  {
    label: "Discover",
    href: "/learn",
    children: [
      { label: "Buying Guides", href: "/learn" },
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
      { label: "Contact", href: "/about" },
      { label: "Trade Enquiries", href: "/about" },
    ],
  },
];
