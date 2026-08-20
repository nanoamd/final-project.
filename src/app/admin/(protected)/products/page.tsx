import type { Metadata } from "next";
import Link from "next/link";

import { getReadiness } from "@/server/actions/product-quality";

import { ReadinessView } from "./readiness-view";

export const metadata: Metadata = {
  title: "Product readiness",
  robots: { index: false, follow: false },
};

// Scores the whole catalogue on every load. Deliberately not cached: the point
// of the screen is to answer "where is it now", and a stale readiness figure is
// worse than a slow one.
export const dynamic = "force-dynamic";

export default async function ProductReadinessPage() {
  const report = await getReadiness();

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-baseline gap-3">
        <h1
          className="text-[12px] font-semibold tracking-[0.18em] uppercase"
          style={{ color: "var(--hq-accent)" }}
        >
          Product readiness
        </h1>
        <Link
          href="/admin"
          className="text-[11px]"
          style={{ color: "var(--hq-faint)" }}
        >
          ← Dashboard
        </Link>
      </div>

      {report.totals.all === 0 ? (
        <p className="text-[12px]" style={{ color: "var(--hq-dim)" }}>
          The catalogue could not be read. This screen needs
          <code className="hq-num mx-1">SANITY_API_WRITE_TOKEN</code>
          set, because it reports on drafts as well as published products.
        </p>
      ) : (
        <ReadinessView report={report} />
      )}
    </div>
  );
}
