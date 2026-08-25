"use client";

import {
  ChevronUp,
  LayoutDashboard,
  Mail,
  Package,
  PenSquare,
  X,
} from "lucide-react";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";

/**
 * A private way into the admin, from the site itself.
 *
 * "accessible only for me on the website and not visible to other customers, it
 * makes it quicker to access."
 *
 * Client-side, and that is the whole design constraint. The first version was a
 * Server Component in the storefront layout, which read cookies to identify the
 * admin — and product pages are statically prerendered, so reading cookies above
 * them broke every one of them with `DYNAMIC_SERVER_USAGE`. Static product pages
 * are this site's SEO and speed; a shortcut for one person cannot cost them.
 *
 * So the check happens in `/api/admin-bar` after the page has loaded. Nothing is
 * rendered until that answers, and it answers 204 for everybody who is not an
 * admin. The links come back in that response rather than living in this bundle,
 * so the admin paths are not published to every visitor.
 *
 * Not a security boundary either way — /admin gates every page and action itself.
 */

interface AdminBarData {
  email: string;
  role: string;
  links: { label: string; href: string; icon: string }[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  orders: Package,
  emails: Mail,
  studio: PenSquare,
};

const COOKIE = "kaiku_admin_bar";
const ONE_YEAR = 60 * 60 * 24 * 365;

function readCollapsed(): boolean {
  return document.cookie
    .split("; ")
    .some((entry) => entry === `${COOKIE}=collapsed`);
}

export function AdminBar() {
  const [data, setData] = React.useState<AdminBarData | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    // `no-store` so a signed-out visitor can never be served a cached copy of
    // somebody's admin bar, and vice versa.
    fetch("/api/admin-bar", { cache: "no-store" })
      .then((response) => (response.status === 204 ? null : response.json()))
      .then((payload: AdminBarData | null) => {
        if (cancelled || !payload) return;
        setCollapsed(readCollapsed());
        setData(payload);
      })
      .catch(() => {
        // Not an admin, offline, or the route is unavailable. Either way the
        // storefront carries on with no bar, which is the correct outcome.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(next: boolean) {
    setCollapsed(next);
    document.cookie = `${COOKIE}=${next ? "collapsed" : "open"};path=/;max-age=${ONE_YEAR};samesite=lax`;
  }

  if (!data) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => toggle(false)}
        aria-label="Show admin shortcuts"
        className="fixed bottom-0 left-3 z-50 flex items-center gap-1 rounded-t-md bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-white/80 uppercase backdrop-blur transition-colors hover:bg-neutral-900 print:hidden"
      >
        <ChevronUp className="size-3" aria-hidden />
        Admin
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full print:hidden">
      <div className="flex items-center gap-1 overflow-x-auto bg-neutral-900/95 px-3 py-1.5 text-[12px] text-white/90 backdrop-blur">
        <span className="mr-1 shrink-0 text-[10px] font-semibold tracking-[0.1em] text-white/40 uppercase">
          Kaiku
        </span>
        <nav
          aria-label="Admin shortcuts"
          className="flex shrink-0 items-center gap-0.5"
        >
          {data.links.map((link) => {
            const Icon = ICONS[link.icon];
            return (
              <AppLink
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-white/10"
              >
                {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                {link.label}
              </AppLink>
            );
          })}
        </nav>
        <span className="ml-auto hidden shrink-0 pl-3 text-[11px] text-white/35 sm:block">
          {data.email}
          {data.role === "owner" ? "" : ` · ${data.role}`}
        </span>
        <button
          type="button"
          onClick={() => toggle(true)}
          aria-label="Hide admin shortcuts"
          className="ml-2 shrink-0 rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
