"use client";

import { Menu, Search, User, X } from "lucide-react";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { primaryNav, siteConfig, utilityNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-50 border-b backdrop-blur-md">
      {/* Announcement bar */}
      <div className="border-line/70 bg-charcoal text-canvas hidden border-b md:block">
        <Container className="text-canvas/75 flex h-9 items-center justify-between text-[12px] tracking-wide">
          <span>{siteConfig.tagline}</span>
          <AppLink
            href="/quote"
            className="hover:text-canvas transition-colors"
          >
            Request a quote →
          </AppLink>
        </Container>
      </div>

      {/* Main bar */}
      <Container className="flex h-18 items-center justify-between gap-6">
        <AppLink
          href="/"
          className="font-display text-ink text-[1.6rem] leading-none tracking-tight"
        >
          {siteConfig.name}
        </AppLink>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <AppLink href={item.href} className={navLinkClass}>
                  {item.label}
                </AppLink>
                <div className="invisible absolute top-full left-1/2 z-50 w-[34rem] -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="border-line bg-paper grid grid-cols-2 gap-1 border p-3 shadow-[0_24px_60px_-30px_rgba(34,31,27,0.4)]">
                    {item.children.map((child) => (
                      <AppLink
                        key={child.href}
                        href={child.href}
                        className="hover:bg-sand flex flex-col gap-1 rounded-md px-4 py-3 transition-colors"
                      >
                        <span className="text-ink text-[15px] font-medium">
                          {child.label}
                        </span>
                        {child.description ? (
                          <span className="text-muted text-[13px] leading-snug">
                            {child.description}
                          </span>
                        ) : null}
                      </AppLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <AppLink
                key={item.href}
                href={item.href}
                className={navLinkClass}
              >
                {item.label}
              </AppLink>
            ),
          )}
        </nav>

        {/* Utilities */}
        <div className="flex items-center gap-1 sm:gap-2">
          {utilityNav.map((item) => (
            <AppLink
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="text-graphite hover:bg-sand hover:text-ink hidden size-10 items-center justify-center rounded-full transition-colors sm:flex"
            >
              {item.label === "Search" ? (
                <Search className="size-[18px]" strokeWidth={1.6} />
              ) : (
                <User className="size-[18px]" strokeWidth={1.6} />
              )}
            </AppLink>
          ))}
          <AppLink
            href="/quote"
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "hidden md:inline-flex",
            )}
          >
            Request a quote
          </AppLink>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-ink hover:bg-sand flex size-10 items-center justify-center rounded-full transition-colors lg:hidden"
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </Container>

      {open ? <MobileMenu onClose={() => setOpen(false)} /> : null}
    </header>
  );
}

const navLinkClass = "text-sm text-graphite transition-colors hover:text-ink";

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-canvas fixed inset-0 z-50 flex flex-col lg:hidden">
      <div className="border-line flex h-18 items-center justify-between border-b px-6">
        <span className="font-display text-[1.6rem] leading-none tracking-tight">
          {siteConfig.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="text-ink hover:bg-sand flex size-10 items-center justify-center rounded-full"
        >
          <X className="size-5" strokeWidth={1.6} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
        {primaryNav.map((item) => (
          <div key={item.href} className="border-line/60 border-b py-1">
            <AppLink
              href={item.href}
              onClick={onClose}
              className="font-display text-ink block py-3 text-2xl tracking-tight"
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
                    className="text-muted py-1.5 text-[15px]"
                  >
                    {child.label}
                  </AppLink>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="border-line flex items-center gap-3 border-t px-6 py-5">
        <AppLink
          href="/quote"
          onClick={onClose}
          className={cn(buttonVariants({ variant: "primary" }), "flex-1")}
        >
          Request a quote
        </AppLink>
        {utilityNav.map((item) => (
          <AppLink
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-label={item.label}
            className="border-line text-ink flex size-11 items-center justify-center rounded-full border"
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
