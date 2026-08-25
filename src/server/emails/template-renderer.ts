import "server-only";

import {
  type BuiltEmail,
  button,
  divider,
  escapeHtmlWithBreaks,
  eyebrow,
  heading,
  image,
  lineItemsTable,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
} from "./layout";

/**
 * Renders an editor-authored email (see the `emailTemplate` document type) into
 * the same table-based, inline-styled HTML the built-in templates produce.
 *
 * The contract with the editor is that they choose *intent* — a heading, an
 * image, a button — and this decides the markup. That is what keeps a
 * Studio-authored email rendering correctly in Outlook, where a WYSIWYG
 * editor's own HTML would not.
 *
 * **Fallback is the whole safety story.** `renderTemplate` returns `null` for a
 * template that is missing, not enabled, or has nothing in it, and every caller
 * treats `null` as "send the built-in version". A transactional email must not
 * fail to send because somebody was midway through editing it.
 */

/** What the editor can drop into `{{ }}`. Missing keys are left as typed. */
export type EmailVariables = Record<string, string | null | undefined>;

export interface EmailTemplateBlock {
  _type: string;
  _key?: string;
  text?: string;
  eyebrow?: string;
  small?: boolean;
  alt?: string;
  width?: number;
  href?: string;
  label?: string;
  height?: number;
  /** Resolved by the query — Sanity's CDN URL for an `image` field. */
  imageUrl?: string | null;
}

export interface EmailTemplateDoc {
  key: string;
  enabled?: boolean;
  subject: string;
  preheader?: string;
  blocks?: EmailTemplateBlock[];
}

/** The order lines an `emailOrderSummary` block renders, when there are any. */
export interface OrderSummaryLine {
  description: string;
  quantity: number | null;
  amount: string;
  meta?: string | null;
}

/**
 * Substitutes `{{name}}` from `variables`.
 *
 * An unknown placeholder is deliberately left exactly as it was rather than
 * replaced with an empty string. Blanking it would silently turn a typo —
 * `{{customerNmae}}` — into a sentence with a hole in it that nobody notices
 * until a customer reads it; leaving it visible makes the mistake obvious the
 * first time the editor sends a test.
 */
export function fillVariables(
  input: string,
  variables: EmailVariables,
): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
    const value = variables[name];
    return value === undefined || value === null ? whole : value;
  });
}

/**
 * One block into HTML. Text goes through `escapeHtmlWithBreaks` *after*
 * variable substitution, so a customer name containing an apostrophe cannot
 * break the surrounding markup — the same rule the built-in templates follow.
 */
function blockToHtml(
  block: EmailTemplateBlock,
  variables: EmailVariables,
  orderLines: OrderSummaryLine[],
): string {
  const fill = (value?: string) =>
    value ? fillVariables(value, variables) : "";

  switch (block._type) {
    case "emailHeading": {
      const parts: string[] = [];
      if (block.eyebrow) parts.push(eyebrow(fill(block.eyebrow)));
      parts.push(heading(fill(block.text)));
      return parts.join("");
    }
    case "emailText": {
      const html = escapeHtmlWithBreaks(fill(block.text));
      return block.small ? smallPrint(html) : paragraph(html);
    }
    case "emailImage": {
      if (!block.imageUrl) return "";
      return image({
        src: block.imageUrl,
        alt: fill(block.alt) || "",
        width: block.width ?? 600,
        href: block.href ? fill(block.href) : null,
      });
    }
    case "emailButton": {
      const href = fill(block.href);
      // A button whose link resolved to nothing is dropped rather than rendered
      // dead — an unclickable "Track your order" is worse than no button.
      if (!href || /^\{\{/.test(href)) return "";
      return button(href, fill(block.label));
    }
    case "emailOrderSummary": {
      if (!orderLines.length) return "";
      // lineItemsTable takes pre-escaped HTML, so each field is escaped here
      // rather than trusted — a product title is supplier text.
      return lineItemsTable(
        orderLines.map((line) => ({
          title: escapeHtmlWithBreaks(line.description),
          detail: [
            line.quantity && line.quantity > 1
              ? `Quantity: ${line.quantity}`
              : null,
            line.meta,
          ]
            .filter(Boolean)
            .map((part) => escapeHtmlWithBreaks(String(part)))
            .join(" · "),
          amount: escapeHtmlWithBreaks(line.amount),
        })),
      );
    }
    case "emailDivider":
      return divider();
    case "emailSpacer":
      return spacer(block.height ?? 20);
    default:
      // An unknown block type means the schema gained a block this renderer has
      // not learned yet. Skipping it keeps the email sending.
      return "";
  }
}

/** The plain-text alternative, from the same blocks. */
function blockToText(
  block: EmailTemplateBlock,
  variables: EmailVariables,
  orderLines: OrderSummaryLine[],
): string | null {
  const fill = (value?: string) =>
    value ? fillVariables(value, variables) : "";

  switch (block._type) {
    case "emailHeading":
      return [fill(block.eyebrow), fill(block.text)].filter(Boolean).join("\n");
    case "emailText":
      return fill(block.text);
    case "emailButton": {
      const href = fill(block.href);
      if (!href || /^\{\{/.test(href)) return null;
      return `${fill(block.label)}: ${href}`;
    }
    case "emailImage":
      // The description, not the URL — a text-only reader wants to know what
      // was pictured, not to paste a CDN link.
      return fill(block.alt) || null;
    case "emailOrderSummary":
      return orderLines.length
        ? orderLines
            .map(
              (line) =>
                `${line.quantity && line.quantity > 1 ? `${line.quantity} x ` : ""}${line.description} — ${line.amount}`,
            )
            .join("\n")
        : null;
    default:
      return null;
  }
}

/**
 * `null` when this template should not be used — missing, disabled, or empty —
 * which every caller reads as "send the built-in email instead".
 */
export function renderTemplate({
  template,
  variables,
  orderLines = [],
}: {
  template: EmailTemplateDoc | null | undefined;
  variables: EmailVariables;
  orderLines?: OrderSummaryLine[];
}): BuiltEmail | null {
  if (!template?.enabled) return null;
  if (!template.blocks?.length) return null;
  if (!template.subject?.trim()) return null;

  const html = template.blocks
    .map((block) => blockToHtml(block, variables, orderLines))
    .filter(Boolean)
    .join("");
  // Every block resolving to nothing (all images unset, say) would send a blank
  // email — fall back rather than do that.
  if (!html.trim()) return null;

  const text = renderText(
    template.blocks.map((block) => blockToText(block, variables, orderLines)),
  );

  return {
    subject: fillVariables(template.subject, variables),
    html: renderEmail({
      title: fillVariables(template.subject, variables),
      // renderEmail requires a preheader; falling back to the subject is what
      // the built-in templates effectively get when they pass their own.
      preheader: fillVariables(
        template.preheader?.trim() || template.subject,
        variables,
      ),
      content: html,
    }),
    text,
  };
}
