"use client";

import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import {
  collectionsNav,
  primaryNav,
  siteConfig,
  utilityNav,
} from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Site header — theme-aware chrome shared by every storefront route.
 *
 * Home and Collection render on the near-black ground, so the header is dark.
 * The Product page renders on warm off-white, so the header inverts to light.
 * Theme is derived from the route: a product-detail path (/shop/x/y) is light,
 * everything else is dark. The collection sub-nav appears on shop routes only.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const isShopRoute = segments[0] === "shop";
  const isProductPage = isShopRoute && segments.length >= 3;
  const isCollection = isShopRoute && !isProductPage;
  const isHome = pathname === "/";
  // Home and Collection render on the near-black ground; everything else
  // (product, and the reading-led light pages) takes the light header.
  const theme: "light" | "dark" = isHome || isCollection ? "dark" : "light";

  const t = theme === "dark" ? dark : light;

  // Longest-prefix match so /shop highlights "Shop" and a deeper category
  // route highlights its own item.
  const activePrimary = [...primaryNav]
    .filter((item) => item.href !== "/" && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const activeCollection =
    collectionsNav
      .filter((item) => item.href !== "/shop" && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "/shop";

  return (
    <header className={cn("sticky top-0 z-50 backdrop-blur-md", t.header)}>
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-6 px-6 sm:px-8 lg:px-12">
        <AppLink
          href="/"
          className="text-brass font-display text-[1.5rem] leading-none font-medium tracking-[0.34em] uppercase"
        >
          {siteConfig.name}
        </AppLink>

        <nav className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) => {
            const active = item.href === activePrimary;
            return (
              <AppLink
                key={item.label}
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
            href="/account"
            aria-label="Basket"
            className={cn(
              "relative flex size-10 items-center justify-center rounded-full transition-colors",
              t.icon,
            )}
          >
            <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
            <span className="bg-brass absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
              0
            </span>
          </AppLink>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
              t.icon,
            )}
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {isShopRoute ? (
        <div className={cn("border-t", t.subBar)}>
          <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-7 overflow-x-auto px-6 sm:px-8 lg:px-12 [scrollbar-width:none]">
            {collectionsNav.map((item) => {
              const active = item.href === activeCollection;
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

      {open ? <MobileMenu onClose={() => setOpen(false)} /> : null}
    </header>
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

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-basalt fixed inset-0 z-50 flex flex-col lg:hidden">
      <div className="flex h-18 items-center justify-between border-b border-white/10 px-6">
        <span className="text-brass font-display text-[1.5rem] leading-none font-medium tracking-[0.34em] uppercase">
          {siteConfig.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="text-canvas flex size-10 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" strokeWidth={1.6} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
        {primaryNav.map((item) => (
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
