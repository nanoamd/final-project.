import { getSeoHealth, type SeoIssueRow } from "@/server/actions/hq-seo";

/**
 * SEO & Site Health. Design: docs/kaiku-hq-design.md §4.12.
 *
 * The Search Console band and the nightly-crawler band (404s, sitemap gaps)
 * are not built — see the docstring on getSeoHealth for why. What's here is
 * real: every product's description length, meta description, and image alt
 * text, computed live against Sanity.
 */
export default async function AdminSeoPage() {
  const data = await getSeoHealth();

  return (
    <div className="flex flex-col gap-3">
      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Search Console</span>
        </div>
        <p
          className="px-2.5 py-3 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          Not connected. Clicks, impressions, top queries and the
          &ldquo;page-two-and-close&rdquo; opportunities list need a Google
          Search Console service account — add one under Settings once it
          exists, then this band goes live. In the meantime, pull those reports
          directly from{" "}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--hq-info)" }}
          >
            search.google.com/search-console ↗
          </a>
          .
        </p>
      </section>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Thin product descriptions</span>
          <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
            {data.thinDescriptions.length} under 300 chars
          </span>
        </div>
        <IssueTable
          rows={data.thinDescriptions}
          empty="Nothing thin — every product clears 300 characters."
          metric={(row) => `${row.descriptionLength} chars`}
        />
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="hq-panel">
          <div className="hq-panel-head">
            <span>Missing meta description</span>
            <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
              {data.missingMetaDescription.length}
            </span>
          </div>
          <IssueTable
            rows={data.missingMetaDescription}
            empty="Every product has one, or falls back to the site default."
            metric={() => "—"}
          />
        </section>

        <section className="hq-panel">
          <div className="hq-panel-head">
            <span>Images missing alt text</span>
            <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
              {data.missingAltText.length}
            </span>
          </div>
          <IssueTable
            rows={data.missingAltText}
            empty="Every image has alt text."
            metric={(row) => `${row.imagesMissingAlt} image(s)`}
          />
        </section>
      </div>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Site health</span>
        </div>
        <p
          className="px-2.5 py-3 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          Broken links, duplicate meta, and sitemap gaps need a nightly crawler
          and a <code>site_issues</code> table — real Phase 2 work, not built
          this pass. The three checks above cover what a crawler can&apos;t tell
          you anyway: whether the copy itself is any good.
        </p>
      </section>
    </div>
  );
}

function IssueTable({
  rows,
  empty,
  metric,
}: {
  rows: SeoIssueRow[];
  empty: string;
  metric: (row: SeoIssueRow) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-2.5 py-4 text-[12px]" style={{ color: "var(--hq-dim)" }}>
        {empty}
      </p>
    );
  }
  return (
    <ul className="max-h-[400px] overflow-y-auto">
      {rows.map((row) => (
        <li
          key={`${row.status}-${row.slug}`}
          className="hq-row flex items-center gap-2.5 px-2.5 py-1.5 text-[12px]"
        >
          <span
            className="hq-label shrink-0"
            style={{
              color:
                row.status === "draft" ? "var(--hq-warn)" : "var(--hq-faint)",
            }}
          >
            {row.status}
          </span>
          <span
            className="min-w-0 flex-1 truncate"
            style={{ color: "var(--hq-text)" }}
          >
            {row.title}
          </span>
          <span
            className="hq-num shrink-0"
            style={{ color: "var(--hq-faint)" }}
          >
            {metric(row)}
          </span>
        </li>
      ))}
    </ul>
  );
}
