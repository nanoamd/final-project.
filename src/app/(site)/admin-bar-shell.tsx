"use client";

import { ChevronUp, X } from "lucide-react";
import * as React from "react";

/**
 * The admin bar's chrome: a small fixed strip, collapsible, remembered.
 *
 * Client-side only for the collapse behaviour — the links come from the server
 * component, so nothing about them reaches a signed-out visitor.
 *
 * Collapsible because this sits on top of the storefront Damien is trying to
 * *look* at. A permanent bar across a page whose whole job is to feel like a
 * premium shop would be its own small act of vandalism, so it folds down to one
 * unobtrusive tab and stays that way across pages.
 *
 * The preference is a cookie rather than localStorage so the server can read it
 * and render the right state first time. `document.cookie` is enough to write
 * it: this is a UI preference, not data, and a server action for it would be a
 * round trip to move a strip up and down.
 */
const COOKIE = "kaiku_admin_bar";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function AdminBarShell({
  email,
  role,
  defaultCollapsed,
  children,
}: {
  email: string;
  role: string;
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  function toggle(next: boolean) {
    setCollapsed(next);
    document.cookie = `${COOKIE}=${next ? "collapsed" : "open"};path=/;max-age=${ONE_YEAR};samesite=lax`;
  }

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
          {children}
        </nav>
        <span className="ml-auto hidden shrink-0 pl-3 text-[11px] text-white/35 sm:block">
          {email}
          {role === "owner" ? "" : ` · ${role}`}
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
