import { Check } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function ProductSummary({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-7 lg:pt-2">
      <div className="flex flex-col gap-4">
        {product.badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {product.badges.map((badge) => (
              <Badge key={badge}>{badge}</Badge>
            ))}
          </div>
        ) : null}
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {product.name}
        </h1>
        <p className="text-muted text-lg">{product.tagline}</p>
      </div>

      <p className="text-ink text-2xl">From {formatPrice(product.priceFrom)}</p>

      <p className="text-muted max-w-prose leading-relaxed">
        {product.summary}
      </p>

      <ul className="flex flex-col gap-3">
        {product.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-3 text-[15px]">
            <Check
              className="text-moss mt-0.5 size-[18px] shrink-0"
              strokeWidth={1.8}
            />
            <span className="text-graphite">{highlight}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row">
        <AppLink
          href="/quote"
          className={
            buttonVariants({ variant: "primary", size: "lg" }) + " flex-1"
          }
        >
          Request a quote
        </AppLink>
        <AppLink
          href="/guided-buying"
          className={
            buttonVariants({ variant: "secondary", size: "lg" }) + " flex-1"
          }
        >
          Is this right for me?
        </AppLink>
      </div>

      <dl className="border-line grid grid-cols-2 gap-6 border-t pt-6 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-ink">UK mainland · made to order</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted">Warranty</dt>
          <dd className="text-ink">Manufacturer-backed</dd>
        </div>
      </dl>
    </div>
  );
}
