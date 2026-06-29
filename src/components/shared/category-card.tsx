import { AppLink } from "@/components/ui/app-link";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

export function CategoryCard({
  category,
  className,
  aspect = "aspect-[4/5]",
}: {
  category: Category;
  className?: string;
  aspect?: string;
}) {
  return (
    <AppLink
      href={`/shop/${category.slug}`}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden">
        <PlaceholderImage
          tone={category.tone}
          illustration={category.illustration}
          aspect={aspect}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
          <h3
            className={cn(
              "font-display text-2xl tracking-tight sm:text-[1.7rem]",
              category.tone === "charcoal" ? "text-canvas" : "text-ink",
            )}
          >
            {category.name}
          </h3>
          <span
            className={cn(
              "translate-x-0 text-sm transition-transform duration-300 group-hover:translate-x-1",
              category.tone === "charcoal" ? "text-canvas/80" : "text-graphite",
            )}
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
      <p className="text-muted mt-4 max-w-sm text-sm leading-relaxed">
        {category.tagline}
      </p>
    </AppLink>
  );
}
