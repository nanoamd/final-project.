"use client";

import * as React from "react";

/**
 * Catches errors in the root layout itself — the one place error.tsx can't
 * reach, since error.tsx renders inside the layout it's meant to guard
 * against. Must render its own html/body; everything else (fonts, tokens)
 * may not have mounted.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f4f2ed",
          color: "#1b1b1d",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", marginBottom: "12px" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b6a67", maxWidth: "24rem", marginBottom: "24px" }}>
          An unexpected error occurred loading the site.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#1b1b1d",
            color: "#f4f2ed",
            height: "48px",
            padding: "0 32px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
