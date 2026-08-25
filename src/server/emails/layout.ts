import "server-only";

import { siteConfig } from "@/config/site";

/**
 * Shared HTML shell and block builders for every transactional email.
 *
 * Email clients are not browsers. Outlook on Windows renders through Word's
 * HTML engine, which has no flexbox, no grid, no `<style>`-block support worth
 * relying on, and no external stylesheets. Gmail strips `<head>` styles on some
 * clients too. So everything here is:
 *
 * - tables for layout, `role="presentation"` so screen readers skip them
 * - every style inline on the element it applies to
 * - a fixed `width="600"` attribute *and* `max-width:600px` — the attribute is
 *   what Outlook obeys, the style is what everything else obeys
 * - no images that carry meaning (the wordmark is text, so a blocked-image
 *   client still shows a Kaiku email)
 *
 * Every builder returns a string. Nothing here reads the network or the
 * database, which is what makes the templates testable as pure functions.
 */

/** Brand palette, mirroring the tokens in src/app/globals.css. */
export const palette = {
  canvas: "#f4f2ed",
  card: "#ffffff",
  ink: "#1b1b1d",
  graphite: "#48474a",
  muted: "#6b6a67",
  line: "#e6e2d9",
  brass: "#c65a2c",
} as const;

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** The owner's trading address. Included in every email footer. */
export const postalAddress = "16 Isis Way, Bourne End, SL8 5NF";

/**
 * HTML-escape a value before it goes anywhere near a template.
 *
 * Not a nicety: customer names, product titles and contact-form messages are
 * all attacker-controlled free text, and an unescaped apostrophe or `<` is
 * enough to break the surrounding markup — which in an owner-alert email means
 * the one record of a sale renders as garbage.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape, then turn newlines into `<br />` so pasted prose keeps its shape. */
export function escapeHtmlWithBreaks(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export interface BuiltEmail {
  subject: string;
  html: string;
  /**
   * Plain-text alternative. Sent alongside the HTML on every email: it is what
   * text-only clients, screen readers and spam filters read, and a message with
   * no text part scores measurably worse on delivery.
   */
  text: string;
}

/** A small-caps label above a heading, matching the site's `Eyebrow`. */
export function eyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};">${escapeHtml(
    text,
  )}</p>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:26px;line-height:1.2;font-weight:normal;color:${palette.ink};">${escapeHtml(
    text,
  )}</h1>`;
}

export function subheading(text: string): string {
  return `<h2 style="margin:28px 0 12px;font-family:${SERIF};font-size:17px;line-height:1.3;font-weight:normal;color:${palette.ink};">${escapeHtml(
    text,
  )}</h2>`;
}

/** A body paragraph. `html` is inserted as-is — escape before calling. */
export function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;font-family:${SERIF};font-size:15px;line-height:1.65;color:${palette.graphite};">${html}</p>`;
}

/** Smaller, quieter text — used for legal notes and reference strings. */
export function smallPrint(html: string): string {
  return `<p style="margin:0 0 10px;font-family:${SANS};font-size:12px;line-height:1.6;color:${palette.muted};">${html}</p>`;
}

export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr><td style="border-top:1px solid ${palette.line};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>`;
}

export function spacer(height = 20): string {
  return `<div style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</div>`;
}

/**
 * A link styled as a button. Rendered as a single-cell table rather than a
 * padded `<a>`: Outlook collapses padding on inline elements, so the cell is
 * what actually produces the shape.
 */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;"><tr><td align="center" bgcolor="${palette.ink}" style="background-color:${palette.ink};border-radius:6px;"><a href="${escapeHtml(
    href,
  )}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${palette.canvas};text-decoration:none;">${escapeHtml(
    label,
  )}</a></td></tr></table>`;
}

/**
 * A full-width image.
 *
 * Four things are load-bearing and none of them are decoration:
 *
 * - **`src` must be an absolute URL.** An email has no origin to resolve a
 *   relative path against, so `/images/hero.jpg` renders as a broken icon
 *   everywhere. Sanity's CDN URLs are absolute and already public.
 * - **A `width` attribute as well as the style.** Outlook's Word engine ignores
 *   `max-width`, so without the attribute a 2000px photo blows the layout to
 *   2000px wide and the whole email scrolls sideways.
 * - **`alt` text that says something.** Gmail, Outlook and Apple Mail all block
 *   remote images by default until the reader chooses to load them, so for a
 *   good share of recipients the alt text *is* the image. Empty alt on a
 *   meaningful image means they see nothing.
 * - **`display:block` and `border:0`.** Removes the stray baseline gap under
 *   the image, and stops older Outlook drawing a blue border when it is wrapped
 *   in a link.
 *
 * `width` is the intended display width in pixels, capped at the 600px content
 * column. Supply an image at roughly twice that for sharpness on retina.
 */
export function image({
  src,
  alt,
  width = 600,
  href,
}: {
  src: string;
  alt: string;
  width?: number;
  href?: string | null;
}): string {
  const capped = Math.min(Math.max(Math.round(width), 1), 600);
  const img =
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${capped}" ` +
    `style="display:block;width:100%;max-width:${capped}px;height:auto;border:0;outline:none;text-decoration:none;" />`;
  const wrapped = href
    ? `<a href="${escapeHtml(href)}" style="text-decoration:none;">${img}</a>`
    : img;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 18px;"><tr><td align="center">${wrapped}</td></tr></table>`;
}

export interface EmailRow {
  /** Left-hand cell. Pre-escaped HTML. */
  label: string;
  /** Right-hand cell. Pre-escaped HTML. */
  value: string;
  /** Renders bolder and without a bottom rule — used for a total line. */
  emphasis?: boolean;
}

/** A two-column label/value table: order details, customer details, totals. */
export function detailTable(rows: EmailRow[]): string {
  const cells = rows
    .map((row) => {
      const border = row.emphasis ? "none" : `1px solid ${palette.line}`;
      const weight = row.emphasis ? "600" : "normal";
      const colour = row.emphasis ? palette.ink : palette.graphite;
      return `<tr><td valign="top" style="padding:10px 12px 10px 0;border-bottom:${border};font-family:${SANS};font-size:13px;line-height:1.5;color:${palette.muted};">${row.label}</td><td valign="top" align="right" style="padding:10px 0;border-bottom:${border};font-family:${SANS};font-size:13px;line-height:1.5;font-weight:${weight};color:${colour};">${row.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${cells}</table>`;
}

export interface EmailLineRow {
  /** Product title. Pre-escaped HTML. */
  title: string;
  /** Quantity, options, lead time. Pre-escaped HTML. Optional. */
  detail?: string;
  /** Right-aligned amount. Pre-escaped HTML. Optional. */
  amount?: string;
}

/** The bought-items table. Two columns so it survives a 320px-wide screen. */
export function lineItemsTable(rows: EmailLineRow[]): string {
  const cells = rows
    .map((row) => {
      const detail = row.detail
        ? `<br /><span style="font-family:${SANS};font-size:12px;line-height:1.6;color:${palette.muted};">${row.detail}</span>`
        : "";
      const amount = row.amount ?? "";
      return `<tr><td valign="top" style="padding:14px 12px 14px 0;border-bottom:1px solid ${palette.line};font-family:${SERIF};font-size:15px;line-height:1.4;color:${palette.ink};">${row.title}${detail}</td><td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${palette.line};font-family:${SANS};font-size:14px;line-height:1.4;color:${palette.ink};white-space:nowrap;">${amount}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${cells}</table>`;
}

/**
 * Wraps content in the outer shell: background, 600px card, wordmark, footer.
 *
 * `preheader` is the grey line of text a client shows next to the subject in
 * the inbox list. Left unset, clients invent one from the first words of the
 * markup, which is usually a "view in browser" link or the wordmark.
 */
export function renderEmail({
  title,
  preheader,
  content,
}: {
  title: string;
  preheader: string;
  content: string;
}): string {
  return `<!doctype html>
<html lang="en-GB" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(title)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:${palette.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:${palette.canvas};">${escapeHtml(
    preheader,
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${palette.canvas};">
<tr>
<td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${palette.card};border:1px solid ${palette.line};border-radius:10px;">
<tr>
<td style="padding:28px 32px 0;">
<p style="margin:0;font-family:${SERIF};font-size:20px;letter-spacing:0.16em;text-transform:uppercase;color:${palette.ink};">${siteConfig.name}</p>
</td>
</tr>
<tr>
<td style="padding:24px 32px 32px;">
${content}
</td>
</tr>
<tr>
<td style="padding:0 32px 28px;">
${divider()}
<p style="margin:16px 0 6px;font-family:${SANS};font-size:12px;line-height:1.6;color:${palette.muted};">${escapeHtml(
    siteConfig.legalName,
  )} &middot; ${escapeHtml(postalAddress)}</p>
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${palette.muted};"><a href="mailto:${
    siteConfig.email
  }" style="color:${palette.muted};text-decoration:underline;">${
    siteConfig.email
  }</a> &middot; <a href="${siteConfig.url}" style="color:${
    palette.muted
  };text-decoration:underline;">${siteConfig.url.replace(
    /^https?:\/\//,
    "",
  )}</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

/** The plain-text counterpart of the shell's footer. */
export function textFooter(): string {
  return [
    "—",
    `${siteConfig.legalName}, ${postalAddress}`,
    `${siteConfig.email} · ${siteConfig.url.replace(/^https?:\/\//, "")}`,
  ].join("\n");
}

/**
 * Assemble a plain-text body from blocks, then append the footer. Blank
 * strings are dropped so a template can pass a conditional block inline.
 */
export function renderText(blocks: (string | null | undefined)[]): string {
  const body = blocks
    .filter((block): block is string => Boolean(block && block.trim()))
    .join("\n\n");
  return `${body}\n\n${textFooter()}\n`;
}
