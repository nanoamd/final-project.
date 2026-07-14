import { DesignedForLiving } from "@/features/storefront/components/home/designed-for-living";
import { GardenStudio } from "@/features/storefront/components/home/garden-studio";
import { Hero } from "@/features/storefront/components/home/hero";
import { ShopByCategory } from "@/features/storefront/components/home/shop-by-category";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";

/**
 * Home — the cinematic, editorial storefront on the near-black ground:
 * an asymmetric split hero, a four-up trust bar, the Shop by Category rail,
 * the Garden Studio before/after visualiser, and the closing "designed for
 * how you live" band. Photography is a small licensed set with tonal
 * placeholders where a real image isn't available yet.
 */
export function HomePage() {
  return (
    <div className="bg-basalt">
      <Hero />
      <TrustBar />
      <ShopByCategory />
      <GardenStudio />
      <DesignedForLiving />
    </div>
  );
}
