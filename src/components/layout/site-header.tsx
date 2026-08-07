"use client";

import { useLenis } from "lenis/react";
import { Menu, Search, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { ShopMegaMenu } from "@/components/shared/shop-mega-menu";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import {
  collectionsNav,
  primaryNav,
  siteConfig,
  utilityNav,
} from "@/config/site";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import type {
  SanityCategory,
  SanityDepartment,
  SanityNavigation,
} from "@/types/sanity-content";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** Shared between the toggle's `aria-controls` and the panel's `id`. */
const MOBILE_MENU_ID = "mobile-menu";

/**
 * Site header — theme-aware chrome shared by every storefront route.
 *
 * Home and Collection render on the near-black ground, so the header is dark.
 * The Product page renders on warm off-white, so the header inverts to light.
 * Theme is derived from the route: a product-detail path (/shop/x/y) is light,
 * everything else is dark. The collection sub-nav appears on shop routes only.
 *
 * Nav content comes from the Sanity `navigation` singleton (via a prop from
 * the server layout), falling back to the static config when it's empty or
 * unreachable, so the header looks identical either way.
 */
export function SiteHeader({
  nav,
  siteName,
  rooms,
  categories,
}: {
  nav?: SanityNavigation | null;
  siteName?: string;
  rooms?: SanityDepartment[];
  categories?: SanityCategory[];
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  const [shopMenuOpen, setShopMenuOpen] = React.useState(false);
  const { count } = useCart();
  const lenis = useLenis();

  /**
   * Scroll lock and dismissal for the mobile menu. Both halves of the lock are
   * needed: Lenis owns wheel scrolling for this route group, so `overflow:
   * hidden` alone doesn't stop a trackpad or mouse wheel, and Lenis leaves
   * touch scrolling native by default, so stopping Lenis alone doesn't stop a
   * finger drag. Without both, the page scrolls away behind the open panel.
   */
  React.useEffect(() => {
    if (!open) return;

    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      lenis?.start();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, lenis]);

  const brandName = siteName ?? siteConfig.name;
  const primaryLinks: NavLink[] = nav?.headerLinks?.length
    ? nav.headerLinks
    : primaryNav;
  // Rooms (departments) drive the shop sub-nav when available, falling back
  // to the static category list only if Sanity has no departments yet.
  const roomLinks: NavLink[] =
    rooms?.map((room) => ({
      label: room.name,
      href: `/shop/room/${room.slug}`,
    })) ?? collectionsNav;

  const segments = pathname.split("/").filter(Boolean);
  const isShopRoute = segments[0] === "shop";
  // Any shop route ending in "all" is a white Shop All page: /shop/all,
  // /shop/room/<room>/all and /shop/<category>/all. Matching on the last
  // segment rather than enumerating each shape, because enumerating is what let
  // this break twice — each new /all route fell through and got two things
  // wrong at once:
  //
  //  - These pages render ShopDrillNav, whose first tier is already a room
  //    list, so the header stacked its own near-identical room sub-bar on top:
  //    two rows of the same links, 45px of duplicated chrome above the grid.
  //  - It feeds the theme and isProductPage below. /shop/<category>/all has
  //    three segments and a non-"room" second segment, so without this it was
  //    classified as a product detail page.
  //
  // A product slugged literally "all" would collide, but /shop/<category>/all
  // is a static route and already wins over /shop/<category>/[product], so such
  // a product is unreachable regardless.
  const isShopAllPage = isShopRoute && segments[segments.length - 1] === "all";
  const isProductPage =
    isShopRoute &&
    segments[1] !== "room" &&
    segments.length >= 3 &&
    !isShopAllPage;
  const isCollection = isShopRoute && !isProductPage && !isShopAllPage;
  const isHome = pathname === "/";
  // Home and Collection render on the near-black ground; everything else
  // (product, Shop All, and the reading-led light pages) takes the light
  // header — Shop All is a white commercial-browsing page, not the dark
  // editorial collection index.
  const theme: "light" | "dark" = isHome || isCollection ? "dark" : "light";

  const t = theme === "dark" ? dark : light;

  // Longest-prefix match so /shop highlights "Shop" and a deeper category
  // route highlights its own item.
  const activePrimary = [...primaryLinks]
    .filter((item) => item.href !== "/" && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const activeRoom =
    roomLinks
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ??
    (pathname === "/shop" ? "/shop/room/outdoor-living" : undefined);

  return (
    <>
      <header className={cn("sticky top-0 z-50 backdrop-blur-md", t.header)}>
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-6 px-6 sm:px-8 lg:px-12">
          <AppLink
            href="/"
            className="text-brass font-display text-[1.5rem] leading-none font-medium tracking-[0.34em] uppercase"
          >
            {brandName}
          </AppLink>

          <nav className="hidden items-center gap-8 lg:flex">
            {primaryLinks.map((item) => {
              const active = item.href === activePrimary;
              const isShop = item.href === "/shop";
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => isShop && setShopMenuOpen(true)}
                  onMouseLeave={() => isShop && setShopMenuOpen(false)}
                >
                  <AppLink
                    href={item.href}
                    className={cn(
                      "relative text-[12px] font-medium tracking-[0.16em] uppercase transition-colors",
                      active ? t.navActive : t.navLink,
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span className="bg-brass absolute -bottom-2 left-0 h-px w-full" />
                    ) : null}
                  </AppLink>
                  {isShop && shopMenuOpen && rooms?.length ? (
                    <ShopMegaMenu
                      rooms={rooms}
                      categories={categories ?? []}
                      onNavigate={() => setShopMenuOpen(false)}
                    />
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <AppLink
              href="/search"
              aria-label="Search"
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                t.icon,
              )}
            >
              <Search className="size-[18px]" strokeWidth={1.6} />
            </AppLink>
            <AppLink
              href="/tools"
              aria-label="Tools"
              className={cn(
                "hidden size-10 items-center justify-center rounded-full transition-colors sm:flex",
                t.icon,
              )}
            >
              <Sparkles className="size-[18px]" strokeWidth={1.6} />
            </AppLink>
            <AppLink
              href="/account"
              aria-label="Account"
              className={cn(
                "hidden size-10 items-center justify-center rounded-full transition-colors sm:flex",
                t.icon,
              )}
            >
              <User className="size-[18px]" strokeWidth={1.6} />
            </AppLink>
            <AppLink
              href="/cart"
              aria-label="Basket"
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full transition-colors",
                t.icon,
              )}
            >
              <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
              {count > 0 ? (
                <span className="bg-brass absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </AppLink>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls={MOBILE_MENU_ID}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
                t.icon,
              )}
            >
              <Menu className="size-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {isShopRoute && !isShopAllPage ? (
          <div className={cn("border-t", t.subBar)}>
            {/* The room list overflows on narrow screens. It has always been
                scrollable, but with no affordance it just read as a word cut in
                half at the right edge — the mask fades the last item out so it
                reads as "more to scroll" instead of "broken text". */}
            <div className="mx-auto flex h-11 max-w-[1440px] [scrollbar-width:none] items-center gap-7 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] px-6 sm:[mask-image:none] sm:px-8 lg:px-12">
              {roomLinks.map((item) => {
                const active = item.href === activeRoom;
                return (
                  <AppLink
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "relative shrink-0 py-3 text-[11px] font-medium tracking-[0.16em] whitespace-nowrap uppercase transition-colors",
                      active ? "text-brass" : t.subLink,
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span className="bg-brass absolute bottom-0 left-0 h-px w-full" />
                    ) : null}
                  </AppLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      {open ? (
        <MobileMenu
          links={primaryLinks}
          rooms={roomLinks}
          brandName={brandName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const dark = {
  header: "bg-basalt/85 border-b border-white/10",
  navLink: "text-canvas/65 hover:text-canvas",
  navActive: "text-canvas",
  icon: "text-canvas/80 hover:text-canvas hover:bg-white/10",
  subBar: "border-white/10 bg-basalt/60",
  subLink: "text-canvas/50 hover:text-canvas",
};

const light = {
  header: "bg-canvas/85 border-b border-ink/10",
  navLink: "text-ink/65 hover:text-ink",
  navActive: "text-ink",
  icon: "text-ink/70 hover:text-ink hover:bg-ink/5",
  subBar: "border-ink/10 bg-canvas/70",
  subLink: "text-ink/50 hover:text-ink",
};

function MobileMenu({
  links,
  rooms,
  brandName,
  onClose,
}: {
  links: NavLink[];
  rooms: NavLink[];
  brandName: string;
  onClose: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // Move focus into the panel on open, so a keyboard or screen-reader user
  // lands on the dismiss control rather than being left back at the toggle
  // with the panel's content read out around them.
  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      id={MOBILE_MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label={`${brandName} menu`}
      /* Renders as a sibling of <header>, never inside it. The header carries
         `backdrop-blur-md`, and a backdrop-filter makes an element a
         containing block for its `position: fixed` descendants — so nested
         here, `inset-0` resolved against the 72px header box instead of the
         viewport, and the whole menu was squashed into that strip. */
      className="bg-basalt fixed inset-0 z-[60] flex flex-col lg:hidden"
    >
      <div className="flex h-18 items-center justify-between border-b border-white/10 px-6">
        <span className="text-brass font-display text-[1.5rem] leading-none font-medium tracking-[0.34em] uppercase">
          {brandName}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="text-canvas flex size-11 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" strokeWidth={1.6} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
        {/* First thing in the menu, above the nav tree. Getting to a full
            product list used to mean home → shop → room → category, and there
            was no destination that listed the whole catalogue at all. This is
            one tap from any page on the site. */}
        <AppLink
          href="/shop/all"
          onClick={onClose}
          className="border-brass/40 bg-brass/10 text-canvas mb-5 flex items-center justify-between rounded-lg border px-4 py-4"
        >
          <span className="font-display text-xl tracking-tight">
            All Products
          </span>
          <span
            aria-hidden
            className="text-brass text-[11px] font-medium tracking-[0.16em] uppercase"
          >
            Browse →
          </span>
        </AppLink>

        {links.map((item) => (
          <div key={item.label} className="border-b border-white/10 py-1">
            <AppLink
              href={item.href}
              onClick={onClose}
              className="text-canvas font-display block py-3 text-2xl tracking-tight"
            >
              {item.label}
            </AppLink>
            {item.children ? (
              <div className="flex flex-col gap-1 pb-3">
                {item.children.map((child) => (
                  <AppLink
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className="text-canvas/55 py-1.5 text-[15px]"
                  >
                    {child.label}
                  </AppLink>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {/* Desktop reaches the rooms through the hover mega-menu, which has no
            touch equivalent — so on mobile these 11 destinations were only
            reachable from the sub-bar on /shop routes, i.e. unreachable from
            anywhere else on the site. Two columns because the labels are short
            and a single column pushed the list below the fold. */}
        {rooms.length > 0 ? (
          <div className="pt-6">
            <h2 className="text-canvas/40 px-1 pb-3 text-[11px] font-medium tracking-[0.16em] uppercase">
              Shop by room
            </h2>
            <div className="grid grid-cols-2 gap-x-4">
              {rooms.map((room) => (
                <AppLink
                  key={room.href}
                  href={room.href}
                  onClick={onClose}
                  className="text-canvas/75 hover:text-canvas border-b border-white/5 py-3 text-[15px]"
                >
                  {room.label}
                </AppLink>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 px-6 py-5">
        <AppLink
          href="/shop"
          onClick={onClose}
          className={cn(buttonVariants({ variant: "accent" }), "flex-1")}
        >
          Explore Collections
        </AppLink>
        {utilityNav.map((item) => (
          <AppLink
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-label={item.label}
            className="text-canvas flex size-11 items-center justify-center rounded-full border border-white/15"
          >
            {item.label === "Search" ? (
              <Search className="size-[18px]" strokeWidth={1.6} />
            ) : (
              <User className="size-[18px]" strokeWidth={1.6} />
            )}
          </AppLink>
        ))}
      </div>
    </div>
  );
}
