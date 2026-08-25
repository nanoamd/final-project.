/**
 * Every email Kaiku sends, in one list.
 *
 * This exists because the Studio dropdown and the sending code had drifted
 * apart, silently. The dropdown offered templates for three emails nothing ever
 * looked up, and three emails the code *did* look up could not be selected at
 * all — so "fully customise my emails" was not actually true. A mismatch here is
 * invisible: the template saves, it just never sends.
 *
 * So both sides read this file. The Sanity schema builds its dropdown from it
 * and the senders resolve their key from it, which makes a drift like that a
 * type error rather than a silent dead template.
 *
 * Deliberately free of `server-only` — the Sanity schema is bundled for Studio,
 * which runs in the browser.
 */

/** How an email gets triggered, which decides which variables it can offer. */
export type EmailTrigger =
  /** Sent by the Stripe webhook when payment succeeds. */
  | "payment"
  /** Sent when an order reaches a stage in the admin workflow. */
  | "stage"
  /** Sent when someone submits a form or signs up. */
  | "form";

export interface EmailKind {
  /** The `emailTemplate.key` value. Never change one — templates key off it. */
  key: string;
  /** How it reads in Studio and in the previewer. */
  label: string;
  /** What makes it send, in plain words, shown to the editor. */
  when: string;
  trigger: EmailTrigger;
  /** For `trigger: "stage"`, the order stage that sends it. */
  stage?: string;
}

export const EMAIL_KINDS: readonly EmailKind[] = [
  {
    key: "order-confirmation",
    label: "Order confirmation",
    when: "Immediately after a customer's payment succeeds.",
    trigger: "payment",
  },
  {
    key: "order-in-production",
    label: "Order in production",
    when: 'When you move an order to "In production".',
    trigger: "stage",
    stage: "production",
  },
  {
    key: "order-dispatched",
    label: "Order dispatched",
    when: "When you add tracking details to an order.",
    trigger: "stage",
    stage: "tracking",
  },
  {
    key: "order-delivered",
    label: "Order delivered",
    when: 'When you move an order to "Delivered".',
    trigger: "stage",
    stage: "delivered",
  },
  {
    key: "order-review-request",
    label: "Review request",
    when: 'When you move an order to "Review requested".',
    trigger: "stage",
    stage: "review_requested",
  },
  {
    key: "order-delayed",
    label: "Order delayed",
    when: "When you put an order on hold.",
    trigger: "stage",
    stage: "on_hold",
  },
  {
    key: "order-cancelled",
    label: "Order cancelled",
    when: "When you cancel an order.",
    trigger: "stage",
    stage: "cancelled",
  },
  {
    key: "order-refunded",
    label: "Refund issued",
    when: "When you mark an order refunded.",
    trigger: "stage",
    stage: "refunded",
  },
  {
    key: "newsletter-welcome",
    label: "Newsletter welcome",
    when: "When someone subscribes to the newsletter.",
    trigger: "form",
  },
  {
    key: "quote-received",
    label: "Quote request received",
    when: "To the customer, when they submit the quote form.",
    trigger: "form",
  },
  {
    key: "contact-received",
    label: "Contact form received",
    when: "To the customer, when they submit the contact form.",
    trigger: "form",
  },
] as const;

/** The Studio dropdown, built from the list above rather than repeated. */
export const EMAIL_KIND_OPTIONS = EMAIL_KINDS.map(({ key, label, when }) => ({
  title: `${label} — ${when}`,
  value: key,
}));

export function emailKindByKey(key: string): EmailKind | undefined {
  return EMAIL_KINDS.find((kind) => kind.key === key);
}

/** The template key for an order stage, or `null` for the internal stages. */
export function emailKeyForOrderStage(stage: string): string | null {
  return EMAIL_KINDS.find((kind) => kind.stage === stage)?.key ?? null;
}
