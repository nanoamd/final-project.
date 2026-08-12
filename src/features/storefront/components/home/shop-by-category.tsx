import { Flame } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import type { CategoryTile } from "@/types/sanity-content";

const DEFAULT_TILES: CategoryTile[] = [
  {
    categorySlug: "pergolas",
    categoryName: "Pergolas",
    image: "/images/garden-after.jpg",
  },
  {
    categorySlug: "garden-furniture",
    categoryName: "Outdoor Furniture",
    image: "/images/steam-lake.jpg",
  },
  {
    categorySlug: "outdoor-saunas",
    categoryName: "Saunas & Wellness",
    image: "/images/cedar.jpg",
  },
  {
    categorySlug: "outdoor-kitchens",
    categoryName: "Outdoor Kitchens",
    image: null,
  },
  {
    categorySlug: "fire-pits",
    categoryName: "Fire & Heating",
    image: "/images/hero-fire.jpg",
  },
];

/**
 * Shop by Category — a horizontally scrolling rail of photographic tiles on a
 * white panel.
 *
 * Two deliberate departures from what this was.
 *
 * It was a grid: three columns on mobile, six on desktop. A grid has to fit, so
 * every tile shrank to fit the row — on a phone that meant thumbnails with a
 * two-line clamped label, and adding a category made every tile smaller again. A
 * rail sizes tiles for legibility and lets the row run off the edge, which is also
 * how every shopping app people already use behaves. It scrolls on desktop too, so
 * the range can grow past six without redesigning the section.
 *
 * And it was on the near-black ground. Dark is right for the hero and for editorial
 * bands, but this is the first commercial act on the page — the moment someone picks
 * where to shop — and white reads as a shop rather than a mood film. It also sets up
 * the New & Noteworthy rail directly beneath it as one clean panel.
 */
export function ShopByCategory({
  eyebrow,
  tiles,
}: {
  eyebrow?: string;
  tiles?: CategoryTile[];
}) {
  const list = tiles?.length ? tiles : DEFAULT_TILES;

  return (
    <section className="bg-canvas text-ink border-line border-y">
      <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-4 sm:px-8 lg:px-12 lg:pt-16">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase sm:text-[12px]">
              {eyebrow ?? "Shop by Category"}
            </p>
            <h2 className="font-display mt-2 text-xl tracking-tight sm:text-2xl">
              Start with the room
            </h2>
          </div>
          <AppLink
            href="/shop"
            className="text-muted hover:text-ink flex shrink-0 items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors"
          >
            View All <span aria-hidden>→</span>
          </AppLink>
        </div>
      </div>

      {/* The rail breaks the page's padding on purpose: it starts at the same
          left edge as the heading but runs to the screen edge, so a partially
          visible tile shows there is more without needing an arrow. The gutter is
          applied twice — as padding, so the first tile lines up with the heading,
          and as scroll-padding, because snap-start aligns to the scroll container's
          snap area rather than to its padding box. Without the second, every tile
          after the first snapped flush to the screen edge and the rail looked
          misaligned with the text above it.

          Scroll hygiene matches the shop nav — hidden scrollbar in both engines,
          overscroll contained so a flick cannot trigger the browser's back
          gesture, snap points so it settles on a tile rather than mid-tile, and
          touch-pan-x so vertical page scrolling still works from inside the rail. */}
      <div className="mx-auto max-w-[1440px] pb-10 lg:pb-16">
        <ul className="flex touch-pan-x snap-x snap-mandatory scroll-px-6 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-6 pb-2 sm:scroll-px-8 sm:gap-4 sm:px-8 lg:scroll-px-12 lg:px-12 [&::-webkit-scrollbar]:hidden">
          {list.map((tile) => (
            <li
              key={tile.categorySlug}
              className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[19%]"
            >
              <AppLink
                href={`/shop/${tile.categorySlug}`}
                className="group block"
              >
                <div className="border-line bg-paper relative aspect-[4/5] overflow-hidden rounded-lg border">
                  {tile.image ? (
                    <Image
                      src={tile.image}
                      alt={tile.categoryName}
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 19vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="bg-paper absolute inset-0 flex items-center justify-center">
                      <Flame
                        className="text-brass/50 size-7"
                        strokeWidth={1.2}
                        aria-hidden
                      />
                    </div>
                  )}
                </div>
                {/* Label below the image rather than burned into it. On white
                    there is no gradient scrim to read against, and a caption
                    under a photograph is the editorial convention this is
                    reaching for. */}
                <p className="text-ink group-hover:text-brass mt-3 text-[13px] leading-snug font-medium transition-colors sm:text-[15px]">
                  {tile.categoryName}
                </p>
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
