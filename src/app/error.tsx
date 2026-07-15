"use client";

import Link from "next/link";
import * as React from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="bg-canvas flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-muted text-[13px] font-medium tracking-[0.18em] uppercase">
        Something went wrong
      </p>
      <h1 className="text-ink font-display mt-3 text-3xl tracking-tight sm:text-4xl">
        We hit a snag
      </h1>
      <p className="text-muted mt-3 max-w-sm">
        An unexpected error occurred. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-ink text-canvas flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border-ink/25 text-ink flex h-12 items-center justify-center rounded-lg border px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
