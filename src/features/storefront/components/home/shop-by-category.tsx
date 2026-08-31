import { Flame } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { getCategories } from "@/lib/sanity/queries";
import { railScroller } from "@/lib/ui/rail";
import { cn } from "@/lib/utils";
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
 * Shop by Category — a horizontally scrolling rail of photographic tiles on
 * the near-black ground.
 *
 * It was a grid before this: three columns on mobile, six on desktop. A grid has
 * to fit, so every tile shrank to fit the row — on a phone that meant thumbnails
 * with a two-line clamped label, and adding a category made every tile smaller
 * again. A rail sizes tiles for legibility and lets the row run off the edge,
 * which is also how every shopping app people already use behaves. It scrolls on
 * desktop too, so the range can grow past six without redesigning the section.
 *
 * It briefly sat on a white panel — the reasoning being that the first
 * commercial act on the page should read as a shop rather than a mood film —
 * but Damien wanted it back on black to match the hero and the rest of the
 * dark bands either side of it.
 */
export async function ShopByCategory({
  eyebrow,
  tiles,
}: {
  eyebrow?: string;
  tiles?: CategoryTile[];
}) {
  /**
   * Editorially chosen tiles first, then every other stocked category.
   *
   * The rail showed five, because five was all the Sanity field held — and a rail
   * whose whole point is that it can run past the screen edge showing five items is
   * just a short grid. There are 24 stocked categories.
   *
   * Merged rather than replaced, so the curated tiles keep their chosen photography
   * and their position, and the rest of the range follows in display order. A
   * category with no products is left out: a rail is a promise that tapping leads
   * somewhere, and 17 of the 41 categories are still empty.
   */
  const stocked = (await getCategories()).filter(
    (category) => (category.productCount ?? 0) > 0,
  );
  const curated = tiles?.length ? tiles : DEFAULT_TILES;
  const curatedSlugs = new Set(curated.map((t) => t.categorySlug));
  const list: CategoryTile[] = [
    ...curated,
    ...stocked
      .filter((category) => !curatedSlugs.has(category.slug))
      .map((category) => ({
        categorySlug: category.slug,
        categoryName: category.name,
        image: category.image ?? null,
      })),
  ];

  return (
    <section className="bg-basalt text-canvas border-y border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-4 sm:px-8 lg:px-12 lg:pt-16">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase sm:text-[12px]">
              {eyebrow ?? "Shop by Category"}
            </p>
            {/* These are categories, not rooms — Coffee Tables, Bedside Tables,
                Planters. The previous heading said "Start with the room", which
                described the tier above this one. */}
            <h2 className="font-display mt-2 text-xl tracking-tight sm:text-2xl">
              Browse every collection
            </h2>
          </div>
          <AppLink
            href="/shop"
            className="text-canvas/60 hover:text-canvas flex shrink-0 items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors"
          >
            View All <span aria-hidden>→</span>
          </AppLink>
        </div>
      </div>

      {/* The rail breaks the page's padding on purpose: it starts at the same
          left edge as the heading but runs to the screen edge, so a partially
          visible tile shows there is more without needing an arrow. The gutter
          is the container's own padding, which is what lines the first tile up
          with the heading above it.

          Scroll behaviour is shared with every other rail — see railScroller,
          which also carries the note on why these no longer snap. */}
      <div className="mx-auto max-w-[1440px] pb-10 lg:pb-16">
        <ul
          data-lenis-prevent
          className={cn(
            railScroller,
            "gap-3 px-6 pb-2 sm:gap-4 sm:px-8 lg:px-12",
          )}
        >
          {list.map((tile) => (
            <li
              key={tile.categorySlug}
              className="w-[44%] shrink-0 sm:w-[30%] lg:w-[19%]"
            >
              <AppLink
                href={`/shop/${tile.categorySlug}`}
                className="group block"
              >
                <div className="bg-basalt-card relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10">
                  {tile.image ? (
                    <Image
                      src={tile.image}
                      alt={tile.categoryName}
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 19vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="bg-basalt-card absolute inset-0 flex items-center justify-center">
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
                <p className="text-canvas group-hover:text-brass mt-3 text-[13px] leading-snug font-medium transition-colors sm:text-[15px]">
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
