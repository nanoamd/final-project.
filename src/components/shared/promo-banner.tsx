"use client";

import { X } from "lucide-react";
import * as React from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot() {
  return false;
}

/**
 * Dismissible top banner. The dismissal persists, so a customer who closes it
 * does not meet it again.
 *
 * **Keyed to the message, not to the banner.** Damien changed the banner copy
 * and then: *"i cant see the banner yet"*. The dismissal was one flag —
 * `kaiku-promo-banner-dismissed` — so anyone who had ever clicked the X, which
 * after months of looking at your own shop is everyone who works on it, was
 * permanently blind to every future message. A new message is a new thing to
 * say, and it should get one chance to be seen. Change `id` when the copy
 * changes and it comes back for everybody; leave it alone and a dismissal
 * sticks.
 */
export function PromoBanner({
  id,
  children,
}: {
  /** Bump this whenever the message changes. */
  id: string;
  children: React.ReactNode;
}) {
  const storageKey = `kaiku-promo-banner-dismissed:${id}`;
  const getSnapshot = React.useCallback(
    () => window.localStorage.getItem(storageKey) === "1",
    [storageKey],
  );
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
          window.localStorage.setItem(storageKey, "1");
          setJustDismissed(true);
        }}
        aria-label="Dismiss"
        /* 28px is too small to hit reliably with a thumb, and this is the one
           control that makes the banner go away. Hit area is expanded with a
           pseudo-element on mobile so the button's visual size — and the
           banner's height — stay exactly as they are. */
        className="text-ink/60 hover:text-ink absolute right-3 flex size-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 max-sm:after:absolute max-sm:after:-inset-2"
      >
        <X className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
