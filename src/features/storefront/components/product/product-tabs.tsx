"use client";

import { Gem, Headset, Leaf, type LucideIcon, ShieldCheck } from "lucide-react";
import Image from "next/image";
import * as React from "react";

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
        <p className="text-graphite mt-4 leading-relaxed">
          {`Crafted from premium materials and built with precision, the ${product.name} is as durable as it is beautiful — a considered addition to any room and a space you'll return to for years.`}
        </p>

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
        <div className="border-line relative aspect-[4/3] overflow-hidden rounded-2xl border lg:aspect-auto">
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

function DeliveryPanel({ product }: { product: SanityProduct }) {
  return (
    <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
      <div>
        <h3 className="text-ink text-[13px] font-semibold tracking-[0.1em] uppercase">
          Delivery
        </h3>
        <p className="text-graphite mt-3 leading-relaxed">
          {product.deliveryNotes ?? "Delivery details confirmed at quotation."}
        </p>
      </div>
      <div>
        <h3 className="text-ink text-[13px] font-semibold tracking-[0.1em] uppercase">
          Warranty & Returns
        </h3>
        <p className="text-graphite mt-3 leading-relaxed">
          {product.warrantyNotes ??
            "Comprehensive manufacturer warranty — exact terms confirmed at quotation."}
        </p>
      </div>
    </div>
  );
}

function ReviewsPanel({ product }: { product: SanityProduct }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-ink font-display text-xl">No reviews yet</p>
      <p className="text-graphite max-w-prose text-[14px] leading-relaxed">
        {`The ${product.name} is newly listed, so there's nothing to show here yet. Get in touch and our team can share more detail or put you in contact with an existing customer.`}
      </p>
    </div>
  );
}
