"use client";

import * as React from "react";

/** A failed Supabase/Sanity call anywhere under /admin previously fell
 * through to Next's default error page (outside the admin shell entirely,
 * with a "Sign out" link nowhere in sight). This keeps the sidebar and
 * lets the admin retry in place instead of losing their nav. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-neutral-500">
        Something went wrong
      </p>
      <h1 className="font-display mt-2 text-2xl text-neutral-900">
        Couldn&rsquo;t load this page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-neutral-900 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}
