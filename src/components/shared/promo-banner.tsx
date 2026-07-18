"use client";

import { X } from "lucide-react";
import * as React from "react";

const STORAGE_KEY = "kaiku-promo-banner-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

/** Dismissible top banner — persists dismissal in localStorage so it stays
 * closed on future visits once a customer closes it. */
export function PromoBanner({ children }: { children: React.ReactNode }) {
  const previouslyDismissed = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [justDismissed, setJustDismissed] = React.useState(false);

  if (previouslyDismissed || justDismissed) return null;

  return (
    <div className="bg-brass relative flex items-center justify-center px-10 py-2.5 text-center">
      <p className="text-ink text-[13px] font-medium sm:text-[14px]">
        {children}
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "1");
          setJustDismissed(true);
        }}
        aria-label="Dismiss"
        className="text-ink/60 hover:text-ink absolute right-3 flex size-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
      >
        <X className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
