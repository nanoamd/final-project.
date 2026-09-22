import "server-only";

import { siteConfig } from "@/config/site";
import type { AbandonedLineItem } from "@/lib/commerce/abandoned-checkout";

import { absoluteUrl } from "./format";
import {
  type BuiltEmail,
  button,
  type EmailLineRow,
  escapeHtml,
  eyebrow,
  heading,
  image,
  lineItemsTable,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
  subheading,
} from "./layout";

export interface AbandonedCheckoutData {
  customerName: string | null;
  items: AbandonedLineItem[];
  /** Basket total in pence, as Stripe recorded it. */
  amountTotal: number | null;
  /** Canonical site origin, no trailing slash. */
  siteUrl: string;
}

function money(pence: number | null | undefined): string | null {
  if (pence === null || pence === undefined) return null;
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * A product URL needs both halves. The route is `/shop/[category]/[product]`,
 * so a slug on its own resolves to a category page that does not exist — a
 * 404 in the one email whose entire job is getting somebody back to the piece.
 */
function productPath(item: AbandonedLineItem): string | null {
  if (!item.slug || !item.category) return null;
  return `/shop/${item.category}/${item.slug}`;
}

/** "the Sorelle sofa", "the Sorelle sofa and 2 other pieces" — for `{{itemSummary}}`. */
export function summariseBasket(items: AbandonedLineItem[]): string {
  const names = items
    .map((item) => item.name ?? item.slug)
    .filter((name): name is string => Boolean(name));
  const [first, second] = names;
  if (!first) return "your basket";
  if (names.length === 1) return first;
  if (second && names.length === 2) return `${first} and ${second}`;
  return `${first} and ${names.length - 1} other pieces`;
}

/**
 * The one email sent to someone who started checkout and did not finish.
 *
 * ## Why this is not a nag
 *
 * It goes out on `checkout.session.expired`, which Stripe fires roughly 24
 * hours after the session was created. That is the entire schedule: **one
 * email, once, and never again for that basket.** There is no sequence, no
 * "still thinking?", no countdown, no expiring offer. Someone who ignores it
 * hears nothing further, which is also why it needs no unsubscribe link to be
 * defensible — there is nothing to unsubscribe from.
 *
 * It carries no discount either. A discount here teaches every future customer
 * that the way to buy from Kaiku cheaply is to abandon a basket first, and on
 * a catalogue this margin-thin it would routinely be discounting away the
 * entire profit on the order. What is offered instead is help: most abandoned
 * furniture baskets stall on a question — will it fit, when would it really
 * arrive, what happens if it is wrong — and all three are answered by a reply
 * to an email rather than by money off.
 *
 * ## Why the items are named
 *
 * "You left something behind" without saying what is a marketing email. Naming
 * the piece, at the price they saw, with a link back to it, is a useful one: a
 * day later somebody genuinely may not recall which of four shops the basket
 * was in. Every line comes from Stripe's record of that session, so it is what
 * the customer actually saw, not what the catalogue says today.
 */
export function buildAbandonedCheckoutEmail(
  data: AbandonedCheckoutData,
): BuiltEmail {
  const firstName = data.customerName?.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName
    ? `You left something with us, ${firstName}.`
    : "You left something with us.";
  const subject = "Your Kaiku basket is still here";

  const named = data.items.filter((item) => item.name || item.slug);
  // One piece with a full path gets a link straight back to it; anything else
  // goes to the basket, which is where a multi-line order is rebuilt.
  const only = named.length === 1 ? named[0] : undefined;
  const single = only && productPath(only) ? only : null;
  const returnUrl = absoluteUrl(
    data.siteUrl,
    (single && productPath(single)) || "/cart",
  );
  const returnLabel = single ? "View the piece" : "Return to your basket";
  const total = money(data.amountTotal);

  const rows: EmailLineRow[] = named.map((item) => {
    const title = escapeHtml(item.name ?? item.slug ?? "Item");
    const path = productPath(item);
    const quantity = item.quantity && item.quantity > 1 ? item.quantity : null;
    const unit = money(item.unit_amount);
    return {
      title: path
        ? `<a href="${escapeHtml(
            absoluteUrl(data.siteUrl, path),
          )}" style="color:#1b1b1d;text-decoration:none;">${title}</a>`
        : title,
      detail: quantity ? `Quantity ${quantity}` : undefined,
      amount: unit ? escapeHtml(unit) : undefined,
    };
  });

  const hero =
    single && single.image
      ? image({
          src: single.image,
          alt: single.name ?? "The piece you were looking at",
          href: returnUrl,
        })
      : "";

  const html = renderEmail({
    title: subject,
    preheader: single
      ? `${single.name ?? "Your piece"} is still waiting`
      : "Your basket is still waiting, and we can answer anything you were unsure about",
    content: [
      eyebrow("Still here"),
      heading(greeting),
      paragraph(
        "Nothing was charged and nothing is lost — your basket is where you left it. We kept your address only so we could send you this one note.",
      ),
      hero,
      rows.length ? subheading("What was in it") : "",
      rows.length ? lineItemsTable(rows) : "",
      rows.length && total
        ? smallPrint(`Basket total ${escapeHtml(total)}, UK delivery included.`)
        : "",
      spacer(10),
      button(returnUrl, returnLabel),
      subheading("If something stopped you"),
      paragraph(
        "Most people who get this far and pause have a question rather than a change of heart — whether it will fit the room, when it would actually arrive, or what happens if it turns out to be wrong. All three are worth asking before you spend the money.",
      ),
      paragraph(
        `Reply to this email and it reaches us directly, or write to <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a>. We will measure things, check with the maker, and tell you honestly if the answer is that it is not right for you.`,
      ),
      spacer(6),
      smallPrint(
        "This is the only email we will send about this basket — there is no follow-up after it.",
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const textLines = named.map((item) => {
    const quantity =
      item.quantity && item.quantity > 1 ? ` x${item.quantity}` : "";
    const unit = money(item.unit_amount);
    return `- ${item.name ?? item.slug}${quantity}${unit ? ` — ${unit}` : ""}`;
  });

  const text = renderText([
    greeting,
    "Nothing was charged and nothing is lost — your basket is where you left it. We kept your address only so we could send you this one note.",
    textLines.length
      ? `WHAT WAS IN IT\n${textLines.join("\n")}${
          total ? `\n\nBasket total ${total}, UK delivery included.` : ""
        }`
      : null,
    `${returnLabel}: ${returnUrl}`,
    "IF SOMETHING STOPPED YOU\nMost people who get this far and pause have a question rather than a change of heart — whether it will fit the room, when it would actually arrive, or what happens if it turns out to be wrong. All three are worth asking before you spend the money.",
    `Reply to this email and it reaches us directly, or write to ${siteConfig.email}. We will measure things, check with the maker, and tell you honestly if the answer is that it is not right for you.`,
    "This is the only email we will send about this basket — there is no follow-up after it.",
  ]);

  return { subject, html, text };
}
