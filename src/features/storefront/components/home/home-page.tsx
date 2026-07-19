import { AiDesignStudio } from "@/features/storefront/components/home/ai-design-studio";
import { BuyingGuides } from "@/features/storefront/components/home/buying-guides";
import { CustomerJourney } from "@/features/storefront/components/home/customer-journey";
import { DesignPhilosophy } from "@/features/storefront/components/home/design-philosophy";
import { DesignedForLiving } from "@/features/storefront/components/home/designed-for-living";
import { EditorialJournal } from "@/features/storefront/components/home/editorial-journal";
import { FeaturedCollection } from "@/features/storefront/components/home/featured-collection";
import { FeaturedTransformation } from "@/features/storefront/components/home/featured-transformation";
import { GardenStudio } from "@/features/storefront/components/home/garden-studio";
import { Hero } from "@/features/storefront/components/home/hero";
import { HomeCategories } from "@/features/storefront/components/home/home-categories";
import { InspirationGallery } from "@/features/storefront/components/home/inspiration-gallery";
import { JournalSignup } from "@/features/storefront/components/home/journal-signup";
import { Materials } from "@/features/storefront/components/home/materials";
import { ShopByCategory } from "@/features/storefront/components/home/shop-by-category";
import { SupplierStandards } from "@/features/storefront/components/home/supplier-standards";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";
import { WhyKaiku } from "@/features/storefront/components/home/why-kaiku";
import { getHomepage } from "@/lib/sanity/queries/homepage";
import { getProduct } from "@/lib/sanity/queries/product";

/**
 * Home — the cinematic, editorial storefront on the near-black ground:
 * an asymmetric split hero, a four-up trust bar, the Shop by Category rail,
 * the Garden Studio before/after visualiser, and the closing "designed for
 * how you live" band.
 *
 * Content comes from the Sanity `homepage` singleton. Every section falls
 * back to its own built-in defaults (the site's original hardcoded copy) when
 * the singleton is empty or unreachable, so the page looks identical whether
 * or not Sanity is configured yet.
 */
export async function HomePage() {
  const homepage = await getHomepage();
  const featuredProduct = homepage?.heroFeaturedProductSlug
    ? await getProduct(homepage.heroFeaturedProductSlug)
    : null;

  return (
    <div className="bg-basalt">
      <Hero
        content={{
          eyebrow: homepage?.heroEyebrow,
          headline: homepage?.heroHeadline,
          highlight: homepage?.heroHighlight,
          subcopy: homepage?.heroSubcopy,
          image: homepage?.heroImage,
          ctaPrimary: homepage?.heroCtaPrimary,
          ctaSecondary: homepage?.heroCtaSecondary,
          featuredProduct,
        }}
      />
      <TrustBar items={homepage?.trustBarItems} />
      <ShopByCategory
        eyebrow={homepage?.shopByCategoryEyebrow}
        tiles={homepage?.shopByCategoryTiles}
      />
      <GardenStudio
        content={{
          eyebrow: homepage?.gardenStudioEyebrow,
          headline: homepage?.gardenStudioHeadline,
          body: homepage?.gardenStudioBody,
          beforeImage: homepage?.gardenStudioBeforeImage,
          afterImage: homepage?.gardenStudioAfterImage,
          thumbnails: homepage?.gardenStudioImages,
          cta: homepage?.gardenStudioCta,
        }}
      />
      <DesignedForLiving
        headline={homepage?.designedForLivingHeadline}
        cards={homepage?.designedForLivingCards}
      />
      <BuyingGuides />
      <FeaturedTransformation />
      <FeaturedCollection />
      <EditorialJournal />
      <DesignPhilosophy />
      <Materials />
      <InspirationGallery />
      <HomeCategories />
      <CustomerJourney />
      <WhyKaiku />
      <SupplierStandards />
      <AiDesignStudio />
      <JournalSignup />
    </div>
  );
}
