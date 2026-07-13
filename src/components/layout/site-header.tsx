"use client";

import { Menu, Search, ShoppingBag, X } from "lucide-react";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { primaryNav, siteConfig, utilityNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="bg-basalt/80 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md">
      {/* Main bar */}
      <Container className="flex h-18 items-center justify-between gap-6">
        <AppLink
          href="/"
          className="font-display text-brass text-[1.5rem] leading-none tracking-[0.14em] uppercase"
        >
          {siteConfig.name}
        </AppLink>

        {/* Desktop navigation — kept deliberately minimal: the wordmark and
            one destination. Everything else still exists and is reachable
            from the footer; it just isn't competing for attention here. */}
        <nav className="hidden items-center gap-8 lg:flex">
          <AppLink href="/shop" className={navLinkClass}>
            Shop
          </AppLink>
        </nav>

        {/* Utilities */}
        <div className="flex items-center gap-1 sm:gap-2">
          <AppLink
            href="/search"
            aria-label="Search"
            className="text-canvas/80 hover:text-canvas flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <Search className="size-[18px]" strokeWidth={1.6} />
          </AppLink>
          <AppLink
            href="/account"
            aria-label="Bag"
            className="text-canvas/80 hover:text-canvas relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
            <span className="bg-brass text-basalt-deep absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
              2
            </span>
          </AppLink>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-canvas flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </Container>

      {open ? <MobileMenu onClose={() => setOpen(false)} /> : null}
    </header>
  );
}

const navLinkClass =
  "text-sm text-canvas/70 transition-colors hover:text-canvas";

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-basalt fixed inset-0 z-50 flex flex-col">
      <div className="flex h-18 items-center justify-between border-b border-white/10 px-6">
        <span className="font-display text-brass text-[1.5rem] leading-none tracking-[0.14em] uppercase">
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
          <div key={item.href} className="border-b border-white/10 py-1">
            <AppLink
              href={item.href}
              onClick={onClose}
              className="font-display text-canvas block py-3 text-2xl tracking-tight"
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
            <Search className="size-[18px]" strokeWidth={1.6} />
          </AppLink>
        ))}
      </div>
    </div>
  );
}
