import { AfterYouOrder } from "@/features/storefront/components/home/after-you-order";
import { AiDesignStudio } from "@/features/storefront/components/home/ai-design-studio";
import { BuyingGuides } from "@/features/storefront/components/home/buying-guides";
import { CuratedFeaturedProduct } from "@/features/storefront/components/home/curated-featured-product";
import { DesignPhilosophy } from "@/features/storefront/components/home/design-philosophy";
import { DesignedForLiving } from "@/features/storefront/components/home/designed-for-living";
import { EditorialJournal } from "@/features/storefront/components/home/editorial-journal";
import { EveryRoom } from "@/features/storefront/components/home/every-room";
import { FeaturedCollection } from "@/features/storefront/components/home/featured-collection";
import { FeaturedProduct } from "@/features/storefront/components/home/featured-product";
import { FeaturedTransformation } from "@/features/storefront/components/home/featured-transformation";
import { GardenStudio } from "@/features/storefront/components/home/garden-studio";
import { Hero } from "@/features/storefront/components/home/hero";
import { HomeCategories } from "@/features/storefront/components/home/home-categories";
import { InspirationGallery } from "@/features/storefront/components/home/inspiration-gallery";
import { JournalSignup } from "@/features/storefront/components/home/journal-signup";
import { Materials } from "@/features/storefront/components/home/materials";
import { NewAndNoteworthy } from "@/features/storefront/components/home/new-and-noteworthy";
import { ShopByCategory } from "@/features/storefront/components/home/shop-by-category";
import { SupplierStandards } from "@/features/storefront/components/home/supplier-standards";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";
import { WhoYouBuyFrom } from "@/features/storefront/components/home/who-you-buy-from";
import { WhyKaiku } from "@/features/storefront/components/home/why-kaiku";
import { SiteBanner } from "@/features/storefront/components/shared/site-banner";
import { getHomepage } from "@/lib/sanity/queries/homepage";
import { getFlagshipProduct, getProduct } from "@/lib/sanity/queries/product";

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
  const pinnedProduct = homepage?.heroFeaturedProductSlug
    ? await getProduct(homepage.heroFeaturedProductSlug)
    : null;
  // Falls back to the flagship product whenever the editorial pin is empty
  // or points at something deleted/unpublished, so the hero can never get
  // stuck showing a dead reference.
  const featuredProduct = pinnedProduct ?? (await getFlagshipProduct());

  // Six long-form brand-essay bands are desktop-only. The mobile homepage ran
  // 14,017px across 20 sections — about 17 phone screens — and roughly 7,000px
  // of that sat *after* the commercial content (the flagship product, the
  // category rail, the curated product), so a visitor who wanted to buy had
  // already seen everything worth tapping by ~3,000px and then scrolled essays.
  // These six are the ones that carry no product link and no tool: they read
  // well on a wide screen next to their imagery and read as filler on a phone.
  // Nothing is removed from the site — every one of them is still on desktop,
  // and none of them is a navigation destination.
  return (
    <div className="bg-basalt">
      {/* The claim goes above the hero, on the homepage as well as the shop.
       *
       * It was only on the shop pages, which is why Damien could not find it:
       * the one page most first visitors land on had no banner at all. If the
       * line is worth saying it is worth saying here first. Shared with
       * shop-all.tsx via SiteBanner so the two surfaces cannot drift apart. */}
      <SiteBanner />
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
      {/* Breadth before beauty. A professional review found it took too long to
          realise Kaiku sells for every room, and the catalogue agrees: 73% of
          it is indoors while the hero features one of the thirteen saunas.
          This answers "what do you actually sell" in one glance, before any
          editorial band gets a chance to imply "garden shop". */}
      <EveryRoom />
      <FeaturedProduct />
      {/* The category rail and New & Noteworthy read as one white panel between
          the dark hero above and the dark Garden Studio below — pick a room, then
          see actual stock. Before this, the only products a visitor met in the
          first three thousand pixels were the two pinned ones. */}
      <ShopByCategory
        eyebrow={homepage?.shopByCategoryEyebrow}
        tiles={homepage?.shopByCategoryTiles}
      />
      <NewAndNoteworthy />
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
      {/* The same review's headline finding: "the site doesn't seem real,
          someone could order and nothing show up." These two answer it with
          specifics rather than badges, and they sit here — after the visitor
          has seen real stock and before the long editorial run — because that
          is the moment the question actually occurs to somebody. */}
      <AfterYouOrder />
      <WhoYouBuyFrom />
      <DesignedForLiving
        headline={homepage?.designedForLivingHeadline}
        cards={homepage?.designedForLivingCards}
      />
      <CuratedFeaturedProduct />
      {/* 577px on mobile. Desktop keeps it. */}
      <div className="hidden lg:block">
        <FeaturedTransformation />
      </div>
      <FeaturedCollection />
      <EditorialJournal />
      {/* 699px on mobile. Desktop keeps it. */}
      <div className="hidden lg:block">
        <DesignPhilosophy />
      </div>
      {/* 698px on mobile. Desktop keeps it. */}
      <div className="hidden lg:block">
        <Materials />
      </div>
      <InspirationGallery />
      <BuyingGuides />
      <HomeCategories />
      {/* CustomerJourney removed: "Discover / Plan / Choose / Purchase /
          Deliver / Enjoy" is six abstract verbs that describe every shop ever
          built and therefore say nothing about this one. AfterYouOrder does
          its job with facts a visitor can check. */}
      {/* 398px on mobile. Desktop keeps it. */}
      <div className="hidden lg:block">
        <WhyKaiku />
      </div>
      {/* 545px on mobile. Desktop keeps it. */}
      <div className="hidden lg:block">
        <SupplierStandards />
      </div>
      <AiDesignStudio />
      <JournalSignup />
    </div>
  );
}
