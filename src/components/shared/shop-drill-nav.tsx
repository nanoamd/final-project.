"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { cn } from "@/lib/utils";
import type { SanityCategory, SanityDepartment } from "@/types/sanity-content";

/**
 * Three-tier shop drill-nav: Room → Category → Style tag, each tier a
 * separate bar that slides/fades in below the one above it. Desktop gets
 * the "hover to preview" magic (mouse enter expands, leave collapses); every
 * tier is also a tap-to-toggle chevron, since hover doesn't exist on touch —
 * the label itself always stays a plain link, so tapping the text still
 * navigates immediately on both mobile and desktop.
 *
 * Tier 3 (style tags) is fetched on demand per category via a plain fetch()
 * against /api/categories/[slug]/style-tags (a route handler, not a server
 * action import — this file lives under components/shared, which the
 * architectural boundary rules keep presentation-only, same as
 * ShopMegaMenu next to it).
 */
export function ShopDrillNav({
  rooms,
  categories,
  theme,
  roomHrefSuffix = "",
}: {
  rooms: SanityDepartment[];
  categories: SanityCategory[];
  theme: "light" | "dark";
  /** Appended to every room tab's href — empty for the dark room page,
   * "/all" for the white Shop All page's own route when reused there.
   * A plain string rather than a function, since this component is a
   * Client Component: a function prop can't cross the server/client
   * boundary from the Server Component pages that render it. */
  roomHrefSuffix?: string;
}) {
  const pathname = usePathname() ?? "/";
  const t = theme === "dark" ? dark : light;

  const [hoveredRoom, setHoveredRoom] = React.useState<string | null>(null);
  const [clickedRoom, setClickedRoom] = React.useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(
    null,
  );
  const [clickedCategory, setClickedCategory] = React.useState<string | null>(
    null,
  );
  const [tagsBySlug, setTagsBySlug] = React.useState<Record<string, string[]>>(
    {},
  );
  // A Set, not a single slug — rapid hovering across categories can leave
  // more than one request in flight at once (hover A, hover B before A
  // resolves, hover back to A before B resolves). A single shared value
  // would get overwritten by B and no longer recognise A as already
  // loading, firing a duplicate fetch for it.
  const [loadingSlugs, setLoadingSlugs] = React.useState<Set<string>>(
    () => new Set(),
  );

  // Collapse the drill state when navigation changes the page underneath —
  // adjusting state during render (React's sanctioned alternative to an
  // effect for "reset when a prop changes") rather than a useEffect, so
  // this reset happens in the same commit as the navigation, not a tick
  // after it.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setClickedRoom(null);
    setClickedCategory(null);
  }

  const roomLinks = rooms.map((room) => ({
    slug: room.slug,
    name: room.name,
    href: `/shop/room/${room.slug}${roomHrefSuffix}`,
  }));

  const activeRoomSlug =
    roomLinks.find((r) => pathname.startsWith(r.href))?.slug ??
    (pathname === "/shop" ? "outdoor-living" : undefined);

  const effectiveRoom = hoveredRoom ?? clickedRoom ?? activeRoomSlug;
  const tier2Categories = categories.filter(
    (c) => c.departmentSlug === effectiveRoom,
  );

  const effectiveCategory = [hoveredCategory, clickedCategory].find(
    (slug) => slug && tier2Categories.some((c) => c.slug === slug),
  );

  function loadTags(categorySlug: string) {
    if (tagsBySlug[categorySlug] || loadingSlugs.has(categorySlug)) return;
    setLoadingSlugs((prev) => new Set(prev).add(categorySlug));
    fetch(`/api/categories/${categorySlug}/style-tags`)
      .then((res) => (res.ok ? res.json() : { tags: [] }))
      .then(({ tags }: { tags: string[] }) => {
        setTagsBySlug((prev) => ({ ...prev, [categorySlug]: tags }));
      })
      .finally(() =>
        setLoadingSlugs((prev) => {
          const next = new Set(prev);
          next.delete(categorySlug);
          return next;
        }),
      );
  }

  const tier3Tags = effectiveCategory
    ? (tagsBySlug[effectiveCategory] ?? [])
    : [];
  const tier2Open = tier2Categories.length > 0 && Boolean(effectiveRoom);
  const tier3Open = tier3Tags.length > 0 && Boolean(effectiveCategory);

  if (!roomLinks.length) return null;

  return (
    <div
      onMouseLeave={() => {
        setHoveredRoom(null);
        setHoveredCategory(null);
      }}
    >
      <DrillBar theme={t} skew={false}>
        {roomLinks.map((room) => (
          <DrillItem
            key={room.slug}
            active={room.slug === activeRoomSlug}
            expanded={room.slug === effectiveRoom}
            theme={t}
            href={room.href}
            label={room.name}
            hasChildren={categories.some((c) => c.departmentSlug === room.slug)}
            onMouseEnter={() => setHoveredRoom(room.slug)}
            onToggle={() =>
              setClickedRoom((prev) => (prev === room.slug ? null : room.slug))
            }
          />
        ))}
      </DrillBar>

      <ExpandableRow open={tier2Open}>
        <DrillBar theme={t} skew>
          {tier2Categories.map((category) => {
            const knownTags = tagsBySlug[category.slug];
            return (
              <DrillItem
                key={category.slug}
                active={pathname === `/shop/${category.slug}`}
                expanded={category.slug === effectiveCategory}
                theme={t}
                href={`/shop/${category.slug}`}
                label={category.name}
                hasChildren={knownTags === undefined || knownTags.length > 0}
                onMouseEnter={() => {
                  setHoveredCategory(category.slug);
                  loadTags(category.slug);
                }}
                onToggle={() => {
                  const next =
                    clickedCategory === category.slug ? null : category.slug;
                  setClickedCategory(next);
                  if (next) loadTags(next);
                }}
              />
            );
          })}
        </DrillBar>
      </ExpandableRow>

      <ExpandableRow open={tier3Open}>
        <DrillBar theme={t} skew={false} dense>
          {tier3Tags.map((tag) => (
            <AppLink
              key={tag}
              href={`/shop/${effectiveCategory}?style=${encodeURIComponent(tag)}`}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-medium whitespace-nowrap uppercase transition-colors",
                t.tagPill,
              )}
            >
              {tag}
            </AppLink>
          ))}
        </DrillBar>
      </ExpandableRow>
    </div>
  );
}

/** Animates height via the grid-template-rows trick (0fr → 1fr) so the bar
 * beneath slides/fades in without measuring pixel heights in JS. */
function ExpandableRow({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div
        className={cn(
          "overflow-hidden transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A single tier's row. The subtle skew is applied only to the background
 * band (a pseudo layer), never to the text, so labels stay perfectly legible. */
function DrillBar({
  theme,
  skew,
  dense,
  children,
}: {
  theme: typeof dark;
  skew: boolean;
  dense?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative border-t", theme.subBar)}>
      {skew ? (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 origin-top-left -skew-y-1",
            theme.skewFill,
          )}
        />
      ) : null}
      {/* These rows overflow on narrow screens. They have always scrolled, but
          with no affordance the last item just read as a word cut in half at
          the right edge ("COLD PLU…"), which looks like broken text rather
          than "there's more". Same fade the header sub-bar already uses;
          removed from sm up, where the rows fit. */}
      <div
        className={cn(
          "relative mx-auto flex max-w-[1440px] [scrollbar-width:none] items-center gap-7 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] px-6 sm:[mask-image:none] sm:px-8 lg:px-12",
          dense ? "h-10 gap-2.5" : "h-11",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DrillItem({
  href,
  label,
  active,
  expanded,
  hasChildren,
  theme,
  onMouseEnter,
  onToggle,
}: {
  href: string;
  label: string;
  active: boolean;
  expanded: boolean;
  hasChildren: boolean;
  theme: typeof dark;
  onMouseEnter: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className="group flex shrink-0 items-center gap-1"
      onMouseEnter={onMouseEnter}
    >
      <AppLink
        href={href}
        className={cn(
          "relative py-3 text-[11px] font-medium tracking-[0.16em] whitespace-nowrap uppercase transition-colors",
          active ? "text-brass" : theme.subLink,
        )}
      >
        {label}
        {active ? (
          <span className="bg-brass absolute bottom-0 left-0 h-px w-full" />
        ) : null}
      </AppLink>
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Browse ${label} categories`}
          aria-expanded={expanded}
          /* 32px is well under a comfortable touch target. Expanding the hit
             area with a pseudo-element rather than growing the button keeps
             the visual size and costs no layout — important here, because the
             row has a fixed height (h-10 when dense) that a 44px button would
             overflow. Mobile only: at this size the expansion would overlap
             the neighbouring item on the tighter dense rows, and a pointer
             doesn't need the help. */
          className={cn(
            "relative flex size-8 items-center justify-center rounded-full transition-colors",
            "max-sm:after:absolute max-sm:after:-inset-x-1 max-sm:after:-inset-y-2",
            theme.chevron,
          )}
        >
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-200",
              expanded && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
      ) : null}
    </div>
  );
}

const dark = {
  subBar: "border-white/10 bg-basalt/60",
  subLink: "text-canvas/50 hover:text-canvas",
  skewFill: "bg-basalt-raise/70",
  chevron: "text-canvas/40 hover:text-canvas hover:bg-white/10",
  tagPill:
    "border-white/15 text-canvas/70 hover:border-brass/50 hover:text-canvas",
};

const light = {
  subBar: "border-ink/10 bg-canvas/70",
  subLink: "text-ink/50 hover:text-ink",
  skewFill: "bg-ink/[0.03]",
  chevron: "text-ink/40 hover:text-ink hover:bg-ink/10",
  tagPill: "border-ink/15 text-ink/70 hover:border-brass/50 hover:text-ink",
};
