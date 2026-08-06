"use client";

import { PortableText } from "@portabletext/react";
import {
  Gem,
  Headset,
  Leaf,
  type LucideIcon,
  ShieldCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import type { SanityProduct } from "@/types/sanity-content";

const BAND_FEATURES: { icon: LucideIcon; title: string; copy: string }[] = [
  {
    icon: Gem,
    title: "Finest materials",
    copy: "Sustainably sourced Thermowood",
  },
  {
    icon: ShieldCheck,
    title: "Built to last",
    copy: "Weatherproof & low maintenance",
  },
  { icon: Leaf, title: "Wellness at home", copy: "Relax, recover & reconnect" },
  { icon: Headset, title: "Expert support", copy: "Our team is here to help" },
];

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
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <h2 className="text-ink font-display text-3xl tracking-tight">
          Designed for wellness. Built for life.
        </h2>
        <p className="text-graphite mt-5 leading-relaxed">{product.summary}</p>
        {product.description?.length ? (
          <div className="mt-4">
            <PortableText
              value={product.description}
              components={portableTextComponents}
            />
          </div>
        ) : (
          <p className="text-graphite mt-4 leading-relaxed">
            {`Crafted from premium materials and built with precision, the ${product.name} is as durable as it is beautiful — a considered addition to any room and a space you'll return to for years.`}
          </p>
        )}

        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {BAND_FEATURES.map((feature) => (
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
        // height in the lg:grid-cols-2 layout above — without it, a long
        // description makes this a very tall, narrow box, and object-cover
        // ends up zooming into a tiny, near-unrecognisable slice of the photo.
        <div className="border-line relative aspect-[4/3] self-start overflow-hidden rounded-2xl border">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
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
