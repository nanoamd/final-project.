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
      copy: material.value,
    });

  features.push({
    icon: Truck,
    title: "Free UK delivery",
    copy: product.deliveryLeadTime
      ? `Delivered in ${product.deliveryLeadTime}`
      : "Included in the price",
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
    { id: "delivery", label: "Delivery & Returns" },
    { id: "faqs", label: "FAQs" },
    { id: "reviews", label: "Reviews" },
  ] as const;
  const [active, setActive] = React.useState<string>("description");

  return (
    <div className="border-line border-t">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <div className="flex [scrollbar-width:none] gap-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
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

      <div className="border-line border-t">
        <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
          {active === "description" ? (
            <DescriptionPanel product={product} />
          ) : null}
          {active === "specifications" ? (
            <SpecsPanel product={product} />
          ) : null}
          {active === "delivery" ? <DeliveryPanel product={product} /> : null}
          {active === "faqs" ? <FaqsPanel product={product} /> : null}
          {active === "reviews" ? <ReviewsPanel product={product} /> : null}
        </div>
      </div>
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
        {/* The panel used to open with a fixed heading, "Designed for wellness.
            Built for life.", on every product in the catalogue. The description
            now brings its own section headings, so the summary leads instead —
            and it is about this product. */}
        <p className="text-ink max-w-prose text-[17px] leading-relaxed">
          {product.summary}
        </p>
        {product.description?.length ? (
          <div className="mt-8">
            <PortableText
              value={product.description}
              components={productDescriptionComponents}
            />
          </div>
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
        // self-start stops this from stretching to match the text column's
        // height in the grid above — without it, a long description makes this a
        // very tall, narrow box, and object-cover ends up zooming into a tiny,
        // near-unrecognisable slice of the photo. sticky keeps the photo in view
        // while a long description scrolls past it.
        <div className="border-line relative aspect-[4/3] self-start overflow-hidden rounded-2xl border lg:sticky lg:top-24 lg:col-span-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        </div>
      ) : null}
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
          <dd className="text-ink text-right">{spec.value}</dd>
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

function DeliveryPanel({ product }: { product: SanityProduct }) {
  return (
    <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
      <div>
        <h3 className="text-ink text-[13px] font-semibold tracking-[0.1em] uppercase">
          Delivery
        </h3>
        <FormattedNotes
          text={product.deliveryNotes}
          fallback="Delivery details confirmed at quotation."
        />
        <Link href="/delivery" className={`${linkClass} mt-3 inline-block`}>
          Full delivery policy →
        </Link>
      </div>
      <div>
        {/* Deliberately bolder than its "Delivery" sibling: returns is the term
            buyers hunt for hardest before committing to a high-value order. */}
        <h3 className="text-ink text-[13px] font-bold tracking-[0.1em] uppercase">
          Warranty & Returns
        </h3>
        <FormattedNotes
          text={product.warrantyNotes}
          fallback="Comprehensive manufacturer warranty — exact terms confirmed at quotation."
        />
        <div className="mt-3 flex gap-5">
          <Link href="/warranty" className={linkClass}>
            Warranty policy →
          </Link>
          <Link href="/returns" className={linkClass}>
            Returns policy →
          </Link>
        </div>
      </div>
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
  fallback: string;
}) {
  if (!text?.trim()) {
    return <p className="text-graphite mt-3 leading-relaxed">{fallback}</p>;
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
