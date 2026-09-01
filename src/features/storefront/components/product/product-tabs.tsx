"use client";

import { PortableText } from "@portabletext/react";
import {
  Gem,
  Headset,
  type LucideIcon,
  RotateCcw,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { ProductArtPanel } from "@/components/shared/product-artwork";
import {
  availabilityLine,
  DOORSTEP_DELIVERY_NOTE,
  isLargeFurniture,
  leadTimeLine,
} from "@/lib/catalog/delivery";
import { formatMaterialSpec } from "@/lib/catalog/percentages";
import { productDescriptionComponents } from "@/lib/sanity/product-description-components";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * The four-up band under the description, built from this product's own data.
 *
 * It used to be a hardcoded constant: "Finest materials — Sustainably sourced
 * Thermowood", "Built to last — Weatherproof & low maintenance", "Wellness at
 * home — Relax, recover & reconnect". True of a sauna, and shown identically on
 * every chest of drawers, table lamp and 50ml bottle of essential oil in the
 * catalogue. Four claims about Thermowood on a product made of oak is the kind of
 * detail that tells a shopper the page was assembled rather than written.
 *
 * Now each entry has to be earned from a field on the document, and an entry with
 * nothing behind it is left out rather than filled in.
 */
function bandFeatures(
  product: SanityProduct,
): { icon: LucideIcon; title: string; copy: string }[] {
  const features: { icon: LucideIcon; title: string; copy: string }[] = [];

  // The first material spec, under whichever label the supplier used for it.
  const material = product.specs.find((spec) =>
    /^(materials?|construction|finish|fabric)$/i.test(spec.label),
  );
  if (material)
    features.push({
      icon: Gem,
      title: "Materials",
      // The supplier's composition breakdown is not a selling point. See
      // formatMaterialSpec — "Glass 63%, Iron 5%, Paper 9%, Plastic 23%" reads
      // as "Glass, Plastic, Paper, Iron", and anything that is not a
      // breakdown is left exactly as written.
      copy: formatMaterialSpec(material.value) ?? material.value,
    });

  features.push({
    icon: Truck,
    title: "Free UK delivery",
    // leadTimeLine, not a second copy of the same template — the band and the
    // delivery panel below it must not be able to word this differently.
    copy: leadTimeLine(product),
  });

  features.push({
    icon: RotateCcw,
    title: "14-day returns",
    copy: "Change your mind within 14 days",
  });

  features.push({
    icon: Headset,
    title: "Expert support",
    copy: "Questions answered before you buy",
  });

  return features;
}

export function ProductTabs({ product }: { product: SanityProduct }) {
  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    { id: "delivery", label: "Delivery, Returns & Warranty" },
    { id: "faqs", label: "FAQs" },
    { id: "reviews", label: "Reviews" },
  ] as const;
  const [active, setActive] = React.useState<string>("description");

  return (
    <div className="border-line border-t">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <div
          role="tablist"
          aria-label="Product information"
          data-lenis-prevent
          className="flex [scrollbar-width:none] gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActive(tab.id)}
                className={`relative -mb-px shrink-0 py-5 text-[12px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors ${
                  isActive ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
                {isActive ? (
                  <span className="bg-brass absolute bottom-0 left-0 h-0.5 w-full" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/**
       * Every panel is in the DOM; the inactive ones are hidden.
       *
       * This used to be `{active === "delivery" ? <DeliveryPanel/> : null}` for
       * each panel, so only the open tab existed in the markup — and the default
       * tab is Description. The consequence was that **delivery, returns,
       * warranty, the FAQs and the reviews were absent from the HTML entirely**,
       * for Google as much as for a reader with JavaScript disabled.
       *
       * That quietly broke three things the brief asks for. The required page
       * structure lists delivery, returns and FAQs as sections of the page. The
       * FAQ structured data has to correspond to content that is actually on the
       * page — Google's own requirement — and it was describing markup that did
       * not exist. And a product page meant to educate a customer cannot be
       * crawled for the half of it that was never rendered.
       *
       * Hidden-with-CSS tabbed content is indexed; absent-from-DOM content is
       * not. `hidden` rather than a class, so assistive technology and find-in-page
       * both agree with what is on screen.
       */}
      <div className="border-line border-t">
        <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={active !== tab.id}
            >
              {tab.id === "description" ? (
                <DescriptionPanel product={product} />
              ) : null}
              {tab.id === "specifications" ? (
                <WithSideArt product={product}>
                  <SpecsPanel product={product} />
                </WithSideArt>
              ) : null}
              {tab.id === "delivery" ? (
                <WithSideArt product={product}>
                  <DeliveryPanel product={product} />
                </WithSideArt>
              ) : null}
              {tab.id === "faqs" ? (
                <WithSideArt product={product}>
                  <FaqsPanel product={product} />
                </WithSideArt>
              ) : null}
              {tab.id === "reviews" ? (
                <WithSideArt product={product}>
                  <ReviewsPanel product={product} />
                </WithSideArt>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Puts the decorative artwork beside a panel that does not fill its width.
 *
 * The brief: *"Some product pages contain large unused empty areas beside
 * descriptions. This space must not remain empty."* This is where that space was.
 * Specifications, Delivery, FAQs and Reviews are all capped at `max-w-3xl` for
 * readability — correct, and it leaves roughly 400px of bare off-white to the right
 * of them on a desktop, worst of all on Reviews, where a new product has two lines
 * of copy in a band the height of a screen.
 *
 * A four-column grid rather than the description's five: the text keeps the width it
 * already had (the 3-of-4 column is wider than `max-w-3xl`, so the cap still
 * decides), and the artwork takes the column that was empty. It is `lg:` only —
 * there is nothing to fill on a phone — and `self-start`, so a short panel does not
 * stretch it into a tall smear.
 */
function WithSideArt({
  product,
  children,
}: {
  product: SanityProduct;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-4 lg:gap-16">
      <div className="lg:col-span-3">{children}</div>
      <ProductArtPanel
        product={product}
        label={product.categoryName}
        className="aspect-[5/7] self-start lg:sticky lg:top-24"
      />
    </div>
  );
}

function DescriptionPanel({ product }: { product: SanityProduct }) {
  return (
    // The description is the column that has to be readable, so it takes three of
    // five and the photo takes two. It was a straight half each, which on a long
    // description meant a narrow column and a great deal of scrolling — the photo
    // does not need the same width as the copy.
    <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
      <div className="lg:col-span-3">
        {/* product.summary is not repeated here — ProductSummary already shows it
            in the buy-box, above the fold and beside the price, so a shopper has
            already read it before they ever open this tab. This panel used to
            lead with it again, which put the same one or two sentences on the
            page twice; the description's own opening line does that job now. */}
        {product.description?.length ? (
          <PortableText
            value={product.description}
            components={productDescriptionComponents}
          />
        ) : null}

        <div className="border-line mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 sm:grid-cols-4">
          {bandFeatures(product).map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2">
              <feature.icon
                className="text-brass size-6"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="text-ink text-[13px] font-semibold">
                {feature.title}
              </p>
              <p className="text-muted text-[12px] leading-snug">
                {feature.copy}
              </p>
            </div>
          ))}
        </div>
      </div>

      {product.image ? (
        /* The travelling column.
         *
         * self-start stops it from stretching to match the text column's height in
         * the grid — without it, a long description makes this a very tall, narrow
         * box, and object-cover ends up zooming into a tiny, near-unrecognisable
         * slice of the photo. sticky keeps it in view while a long description
         * scrolls past. **That behaviour is unchanged and must stay** — Damien
         * singled it out. The sticky/self-start pair has only moved from the photo
         * itself to the wrapper around it, so the photo and the artwork travel
         * together as one column rather than the artwork sitting still while the
         * photo slides over it.
         *
         * The artwork is here because the Description tab is the one the page opens
         * on, and the brief's wording was "empty areas beside descriptions". It was
         * on the other four tabs only, so on a first visit it was invisible.
         */
        <div className="relative lg:col-span-2">
          {/* The photograph travels; the artwork does not.
           *
           * The column deliberately does *not* take `self-start` any more, so it
           * stretches to the description's height and the sticky photo has room to
           * travel — that behaviour is the thing Damien singled out as worth keeping.
           * What changed is that the artwork is no longer inside the sticky wrapper:
           * it sits still in the page while the photograph slides down across it,
           * which is only possible because the artwork now has no surface of its own.
           * `z-10` and the photo's own border are what put it on top. */}
          <div className="border-line bg-paper relative z-10 aspect-[4/3] overflow-hidden rounded-2xl border lg:sticky lg:top-24">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain"
            />
          </div>
          {/* Square, matching the photo's width: a square crop of the 400×560 canvas
              keeps the middle 70%, costing only the repeating edges (the lowest wave,
              the last paving course). Scaled-to-fit was tried first and left the
              drawing floating in margins, which read as a broken image. */}
          <ProductArtPanel
            product={product}
            label={product.categoryName}
            className="mt-6 aspect-square"
          />
        </div>
      ) : (
        // No photograph, so this column was two fifths of nothing. The artwork is
        // the honest filler: it is decoration and looks like decoration, where a
        // stretched or repeated product shot would look like a mistake.
        <ProductArtPanel
          product={product}
          label={product.categoryName}
          className="aspect-[5/7] self-start lg:sticky lg:top-24 lg:col-span-2"
        />
      )}
    </div>
  );
}

function SpecsPanel({ product }: { product: SanityProduct }) {
  if (!product.specs.length) {
    return (
      <p className="text-muted text-[14px]">Specifications coming soon.</p>
    );
  }
  return (
    <dl className="grid max-w-3xl gap-x-10 gap-y-0 sm:grid-cols-2">
      {product.specs.map((spec) => (
        <div
          key={spec.label}
          className="border-line flex justify-between gap-6 border-b py-4 text-[14px]"
        >
          <dt className="text-muted">{spec.label}</dt>
          <dd className="text-ink text-right">
            {formatMaterialSpec(spec.value) ?? spec.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Product-specific copy (deliveryNotes/warrantyNotes) supplements these
// links rather than replacing them — a customer should always be able to
// reach the site's actual policy pages, not just whatever free-text an
// editor did or didn't fill in for this one product.
const linkClass =
  "text-brass text-[13px] font-medium underline underline-offset-4";

/**
 * One heading style for all three sections, so DELIVERY, RETURNS and WARRANTY
 * are visually identical.
 *
 * The brief asks for RETURNS specifically: bold, consistent, clearly visible.
 * Previously it was half of a "Warranty & Returns" heading, which made it
 * neither its own section nor findable by someone scanning for the word — and
 * returns is the thing a buyer hunts for hardest before committing £1,000.
 * Sharing one constant is what keeps "consistent" true as the page changes.
 */
const panelHeading =
  "text-ink text-[13px] font-bold tracking-[0.1em] uppercase";

function DeliveryPanel({ product }: { product: SanityProduct }) {
  const leadTime = leadTimeLine(product);
  const large = isLargeFurniture(product);

  return (
    <div className="max-w-3xl">
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <h3 className={panelHeading}>Delivery</h3>
          {/* Lead time and availability first, as facts, before any free text.
              The brief requires the delivery section to state the expected lead
              time, the availability and the method — and `deliveryLeadTime` is
              set on all 88 published products but was not rendered here at all,
              so the one thing every buyer wants to know was the one thing the
              panel did not say. */}
          <dl className="mt-3 space-y-1.5 text-[14px] leading-relaxed">
            <div>
              <dt className="sr-only">Lead time</dt>
              <dd className="text-ink font-medium">{leadTime}</dd>
            </div>
            <div>
              <dt className="sr-only">Availability</dt>
              <dd className="text-graphite">{availabilityLine(product)}</dd>
            </div>
            <div>
              <dt className="sr-only">Method</dt>
              <dd className="text-graphite">
                {large
                  ? "Two-person doorstep delivery, by arrangement"
                  : "Tracked courier"}
              </dd>
            </div>
          </dl>
          <FormattedNotes text={product.deliveryNotes} fallback={null} />
          <Link href="/delivery" className={`${linkClass} mt-3 inline-block`}>
            Full delivery policy →
          </Link>
        </div>

        <div>
          <h3 className={panelHeading}>Returns</h3>
          <FormattedNotes
            text={product.returnsNotes}
            fallback="14 days from delivery to change your mind. Tell us and we will arrange collection — the piece needs to be unused and in its original packaging."
          />
          <Link href="/returns" className={`${linkClass} mt-3 inline-block`}>
            Returns policy →
          </Link>
        </div>

        <div>
          <h3 className={panelHeading}>Warranty</h3>
          <FormattedNotes
            text={product.warrantyNotes}
            fallback="Comprehensive manufacturer warranty — exact terms confirmed at quotation."
          />
          <Link href="/warranty" className={`${linkClass} mt-3 inline-block`}>
            Warranty policy →
          </Link>
        </div>
      </div>

      {/* Large furniture only. Set out as its own panel rather than a line of
          small print, because a buyer who reads it before ordering does not
          raise a complaint afterwards — doorstep versus room-of-choice is one of
          the most common causes of one. */}
      {large ? (
        <div className="border-brass/30 bg-paper mt-8 border-l-2 p-5">
          <p className="text-ink text-[13px] font-bold tracking-[0.1em] uppercase">
            How large furniture is delivered
          </p>
          <p className="text-graphite mt-2.5 text-[14px] leading-relaxed">
            {DOORSTEP_DELIVERY_NOTE}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Renders free-text notes (deliveryNotes/warrantyNotes) properly instead
 * of dumping them into one <p> — a plain-text Studio field can't store real
 * paragraph/list markup, but its line breaks and "* item" markers are
 * enough to reconstruct one. A run of dash/em-dash-only characters on its
 * own line becomes a section divider. */
function FormattedNotes({
  text,
  fallback,
}: {
  text?: string;
  /** `null` renders nothing — used by the delivery block, whose lead time,
   *  availability and method are already stated above it as facts. */
  fallback: string | null;
}) {
  if (!text?.trim()) {
    return fallback === null ? null : (
      <p className="text-graphite mt-3 leading-relaxed">{fallback}</p>
    );
  }

  // Bullets and dividers sometimes arrive with no real line breaks at all
  // (a single-line string with " * " and "———" inline) — force each onto
  // its own line before splitting, so the grouping below works either way.
  // Only treated as a bullet marker when followed by an uppercase letter —
  // furniture copy is full of genuine multiplication/dimension notation
  // (e.g. "Boxed size: 120 * 60 * 40cm") that " * " would otherwise mangle
  // into a fake list item.
  const normalized = text
    .replace(/\s+\*\s+(?=[A-Z])/g, "\n* ")
    .replace(/[—-]{3,}/g, "\n$&\n");
  const lines = normalized.split("\n").map((line) => line.trim());
  const blocks: { type: "paragraph" | "list" | "divider"; lines: string[] }[] =
    [];
  for (const line of lines) {
    if (!line) continue;
    if (/^[—-]{3,}$/.test(line)) {
      blocks.push({ type: "divider", lines: [] });
      continue;
    }
    const isBullet = line.startsWith("* ");
    const item = isBullet ? line.slice(2).trim() : line;
    const last = blocks.at(-1);
    if (isBullet && last?.type === "list") {
      last.lines.push(item);
    } else {
      blocks.push({ type: isBullet ? "list" : "paragraph", lines: [item] });
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.type === "divider") {
          return (
            <hr key={i} className="border-line my-1 border-t" aria-hidden />
          );
        }
        if (block.type === "list") {
          return (
            <ul
              key={i}
              className="text-graphite list-disc space-y-1.5 pl-5 leading-relaxed"
            >
              {block.lines.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-graphite leading-relaxed">
            {block.lines[0]}
          </p>
        );
      })}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(rating)
              ? "fill-brass text-brass size-4"
              : "text-line size-4"
          }
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewsPanel({ product }: { product: SanityProduct }) {
  if (!product.rating || !product.reviewCount) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-ink font-display text-xl">No reviews yet</p>
        <p className="text-graphite max-w-prose text-[14px] leading-relaxed">
          {`The ${product.name} is newly listed, so there's nothing to show here yet. Get in touch and our team can share more detail or put you in contact with an existing customer.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <StarRow rating={product.rating} />
        <p className="text-ink font-display text-xl">
          {product.rating.toFixed(1)} out of 5
        </p>
      </div>
      <p className="text-graphite text-[14px]">
        Based on {product.reviewCount}{" "}
        {product.reviewCount === 1 ? "review" : "reviews"}.
      </p>
    </div>
  );
}

function FaqsPanel({ product }: { product: SanityProduct }) {
  if (!product.faqs.length) {
    return (
      <p className="text-muted text-[14px]">
        No questions answered for this product yet — get in touch and
        we&rsquo;ll help directly.
      </p>
    );
  }
  return (
    <dl className="border-line divide-line max-w-3xl divide-y border-t">
      {product.faqs.map((faq) => (
        <div key={faq.question} className="py-5">
          <dt className="text-ink text-[15px] font-medium">{faq.question}</dt>
          <dd className="text-graphite mt-2 text-[14px] leading-relaxed">
            {faq.answer}
          </dd>
        </div>
      ))}
    </dl>
  );
}
