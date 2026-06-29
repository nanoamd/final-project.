import { Eyebrow } from "@/components/ui/eyebrow";
import type { Product } from "@/types/catalog";

export function ProductSpecs({ product }: { product: Product }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
      <div className="flex flex-col gap-6">
        <Eyebrow>Specifications</Eyebrow>
        <dl className="border-line border-t">
          {product.specs.map((spec) => (
            <div
              key={spec.label}
              className="border-line flex items-baseline justify-between gap-8 border-b py-4"
            >
              <dt className="text-muted text-sm">{spec.label}</dt>
              <dd className="text-ink text-right text-sm font-medium">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Eyebrow>Delivery &amp; installation</Eyebrow>
          <p className="text-muted leading-relaxed">{product.delivery}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Eyebrow>Warranty</Eyebrow>
          <p className="text-muted leading-relaxed">{product.warranty}</p>
        </div>
        <p className="border-line text-muted border-t pt-6 text-sm leading-relaxed">
          Specifications are indicative placeholder data and are confirmed
          against the chosen model at quotation.
        </p>
      </div>
    </div>
  );
}
