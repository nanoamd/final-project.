/**
 * The questions the quote form asks, in one place.
 *
 * These lists are deliberately not shared with the Server Action: the action
 * treats every answer as free text it sanitises and stores for a person to
 * read, rather than validating against an enum. Nothing downstream branches on
 * these values, so a list edited here can never desync from the server and
 * start silently rejecting real enquiries.
 */

export interface QuoteOption {
  value: string;
  /** Shown on the option itself. */
  label: string;
  /** One line under the label, on the project-type cards only. */
  detail?: string;
}

/**
 * What the customer is planning. Ordered by the value of the enquiry, since
 * this page exists to catch the projects that can't be priced from a product
 * page: saunas, outdoor kitchens, large furniture orders, commercial work.
 */
export const PROJECT_TYPES: QuoteOption[] = [
  {
    value: "Outdoor sauna",
    label: "Outdoor sauna",
    detail: "Cabin, barrel or panoramic",
  },
  {
    value: "Cold plunge",
    label: "Cold plunge",
    detail: "On its own or alongside a sauna",
  },
  {
    value: "Outdoor kitchen",
    label: "Outdoor kitchen",
    detail: "Built-in or modular runs",
  },
  {
    value: "Pergola or garden structure",
    label: "Pergola or structure",
    detail: "Louvred, fixed roof or canopy",
  },
  {
    value: "Large furniture order",
    label: "Large furniture order",
    detail: "Several pieces, or a full set",
  },
  {
    value: "Fire pit or outdoor heating",
    label: "Fire & heating",
    detail: "Fire pits, heaters, log stores",
  },
  {
    value: "Outdoor lighting scheme",
    label: "Lighting scheme",
    detail: "A whole garden, not one lamp",
  },
  {
    value: "Whole garden or terrace project",
    label: "Whole garden or terrace",
    detail: "Several categories together",
  },
  {
    value: "Commercial or trade project",
    label: "Commercial or trade",
    detail: "Multiple units or sites",
  },
];

/**
 * Project types where groundworks and power decide whether the thing can go in
 * at all — answering those two questions up front removes a round trip. The
 * form only asks when one of these is selected.
 */
export const SITED_PROJECT_TYPES = new Set([
  "Outdoor sauna",
  "Cold plunge",
  "Outdoor kitchen",
  "Pergola or garden structure",
  "Whole garden or terrace project",
  "Commercial or trade project",
]);

export const TIMESCALES: QuoteOption[] = [
  { value: "Ready to order now", label: "Ready to order now" },
  { value: "Within 3 months", label: "Within 3 months" },
  { value: "3 to 6 months", label: "3 to 6 months" },
  { value: "Later than 6 months", label: "Later than 6 months" },
  { value: "Still planning", label: "Still planning" },
];

export const BUDGET_GUIDES: QuoteOption[] = [
  { value: "Under £5,000", label: "Under £5,000" },
  { value: "£5,000 to £10,000", label: "£5,000 – £10,000" },
  { value: "£10,000 to £25,000", label: "£10,000 – £25,000" },
  { value: "£25,000 to £50,000", label: "£25,000 – £50,000" },
  { value: "Over £50,000", label: "Over £50,000" },
  { value: "Not sure yet", label: "Not sure yet" },
];

export const SITE_READINESS: QuoteOption[] = [
  { value: "Base already down and level", label: "Base down and level" },
  { value: "Base planned but not built", label: "Base planned, not built" },
  { value: "Groundworks not started", label: "Groundworks not started" },
  { value: "Not sure — please advise", label: "Not sure — please advise" },
];

export const POWER_SUPPLY: QuoteOption[] = [
  { value: "13A socket within reach", label: "13A socket within reach" },
  {
    value: "Dedicated supply available (32A or more)",
    label: "Dedicated supply (32A+)",
  },
  { value: "No power at the spot yet", label: "No power there yet" },
  { value: "Not sure — please advise", label: "Not sure — please advise" },
];

/**
 * What actually changes a quotation. This list is the page's real argument
 * that the enquiry is being handled by someone who has done it before — it
 * names the things that catch people out, rather than claiming experience.
 */
export const WHAT_HELPS: string[] = [
  "Rough dimensions of the space, or a photo with something in it for scale",
  "The access route — the narrowest gate, path or doorway it has to pass through",
  "What the ground is: slabs, decking, gravel or bare lawn",
  "Where the nearest power is, and whether that's a 13A socket or its own supply",
  "How many people will use it, and how often",
  "Any date you're working towards",
];

/** What we do with it once it's sent. Three steps, no invented service levels. */
export const WHAT_HAPPENS_NEXT: { title: string; body: string }[] = [
  {
    title: "We read it properly",
    body: "Not an auto-reply. If something is missing — a dimension, an access width — we come back and ask before pricing anything.",
  },
  {
    title: "We check the specification",
    body: "Sizes, finishes, power requirements and the current lead time, confirmed against the maker rather than read off a page.",
  },
  {
    title: "You get it in writing",
    body: "An itemised quotation in pounds sterling, the lead time stated against each line, and what to expect on delivery day.",
  },
];

/** The three things this page promises, and all three are true today. */
export const QUOTE_PILLARS: { title: string; body: string }[] = [
  {
    title: "No obligation",
    body: "A quotation costs nothing and commits you to nothing.",
  },
  {
    title: "Itemised in writing",
    body: "Every line priced, with its lead time stated beside it.",
  },
  {
    title: "One person, start to finish",
    body: "The same person answers the first question and the last one.",
  },
];
