import { AiDesignStudio } from "@/features/storefront/components/home/ai-design-studio";
import { FeaturedCollections } from "@/features/storefront/components/home/featured-collections";
import { Hero } from "@/features/storefront/components/home/hero";
import { ShopByRoom } from "@/features/storefront/components/home/shop-by-room";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";

/**
 * The photography-led, whole-home homepage built to the approved dark + gold
 * direction: a before/after garden slider hero, trust bar, AI Design Studio,
 * Shop by Room, and Featured Collections. Card imagery is tonal placeholder
 * pending real photography.
 */
export function HomePage() {
  return (
    <div className="bg-basalt">
      <Hero />
      <TrustBar />
      <AiDesignStudio />
      <ShopByRoom />
      <FeaturedCollections />
    </div>
  );
}
