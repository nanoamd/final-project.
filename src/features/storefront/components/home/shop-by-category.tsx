import { CookingPot } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

const CATEGORIES = [
  { label: "Pergolas", href: "/shop/pergolas", image: "/images/garden-after.jpg" },
  {
    label: "Outdoor Furniture",
    href: "/shop/garden-furniture",
    image: "/images/steam-lake.jpg",
  },
  {
    label: "Saunas & Wellness",
    href: "/shop/outdoor-saunas",
    image: "/images/cedar.jpg",
  },
  { label: "Outdoor Kitchens", href: "/shop/outdoor-kitchens", image: null },
  { label: "Fire & Heating", href: "/shop/fire-pits", image: "/images/hero-fire.jpg" },
];

/**
 * Shop by Category — a five-across rail of tall image tiles. Photography-led;
 * a category without a licensed photograph yet falls back to a designed tonal
 * tile rather than a stock stand-in.
 */
export function ShopByCategory() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <p className="text-brass text-[12px] font-medium tracking-[0.24em] uppercase">
            Shop by Category
          </p>
          <AppLink
            href="/shop"
            className="text-canvas/70 hover:text-canvas flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors"
          >
            View All <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <AppLink
              key={cat.label}
              href={cat.href}
              className="group border-white/8 hover:border-brass/40 relative block aspect-[3/4] overflow-hidden rounded-xl border transition-colors"
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="from-basalt-card to-basalt absolute inset-0 flex items-center justify-center bg-gradient-to-br">
                  <CookingPot
                    className="text-brass/70 size-8"
                    strokeWidth={1.2}
                    aria-hidden
                  />
                </div>
              )}
              <div className="from-basalt/95 via-basalt/20 absolute inset-0 bg-gradient-to-t to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-canvas font-display text-[17px] leading-tight">
                  {cat.label}
                </p>
                <p className="text-brass mt-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.16em] uppercase">
                  Explore <span aria-hidden>→</span>
                </p>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
