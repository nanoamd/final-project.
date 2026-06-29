import { AppLink } from "@/components/ui/app-link";
import { Badge } from "@/components/ui/badge";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className={cn("group block", className)}
    >
      <div className="overflow-hidden">
        <PlaceholderImage
          tone={product.tone}
          illustration={product.illustration}
          aspect="aspect-[4/5]"
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-ink decoration-line text-[17px] leading-snug font-medium underline-offset-4 group-hover:underline">
            {product.name}
          </h3>
          <p className="text-muted text-sm">{product.tagline}</p>
        </div>
        <p className="text-muted shrink-0 pt-0.5 text-sm">
          From {formatPrice(product.priceFrom)}
        </p>
      </div>
      {product.badges?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {product.badges.map((badge) => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </div>
      ) : null}
    </AppLink>
  );
}
