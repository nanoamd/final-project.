"use client";

import * as React from "react";

import {
  type Dimension,
  DIMENSION_LABELS,
  DIMENSIONS,
} from "@/lib/catalog/quality";
import type {
  ReadinessReport,
  ScoredProduct,
} from "@/server/actions/product-quality";

/**
 * The catalogue, ranked worst first, with the reason attached.
 *
 * Worst-first is the whole design. A readiness screen sorted alphabetically is
 * a list; sorted by what is most broken, it is a queue of work — the same
 * principle as the alerts feed on the dashboard.
 *
 * Everything is filtered client-side. The catalogue is ~1,400 rows, which is
 * small enough to hold and instant to filter, and a round trip per keystroke
 * would make the search useless for the thing it is for: typing three letters
 * of a product name to find its row.
 */

type TierFilter = "all" | "GOLD" | "SILVER" | "REVIEW";
type StateFilter = "all" | "published" | "drafts" | "unwritten";

export function ReadinessView({ report }: { report: ReadinessReport }) {
  const [tier, setTier] = React.useState<TierFilter>("all");
  const [state, setState] = React.useState<StateFilter>("published");
  const [supplier, setSupplier] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);

  const suppliers = React.useMemo(() => {
    const names = new Set<string>();
    for (const p of report.products) if (p.supplier) names.add(p.supplier);
    return [...names].sort();
  }, [report.products]);

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return report.products
      .filter((p) => {
        if (tier !== "all" && p.tier !== tier) return false;
        if (state === "published" && !p.published) return false;
        if (state === "drafts" && p.published) return false;
        if (state === "unwritten" && (p.published || p.words > 0)) return false;
        if (supplier !== "all" && p.supplier !== supplier) return false;
        if (needle && !p.title.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => a.overall - b.overall || a.title.localeCompare(b.title));
  }, [report.products, tier, state, supplier, query]);

  return (
    <div className="flex flex-col gap-3">
      <Totals report={report} />
      <Medians medians={report.medians} />

      <div className="flex flex-wrap items-center gap-2">
        <Group
          value={state}
          onChange={setState}
          options={[
            ["published", `Published ${report.totals.published}`],
            ["drafts", `Drafts ${report.totals.drafts}`],
            ["unwritten", `Unwritten ${report.totals.unwritten}`],
            ["all", `All ${report.totals.all}`],
          ]}
        />
        <Group
          value={tier}
          onChange={setTier}
          options={[
            ["all", "All tiers"],
            ["GOLD", `Gold ${report.totals.gold}`],
            ["SILVER", `Silver ${report.totals.silver}`],
            ["REVIEW", `Review ${report.totals.review}`],
          ]}
        />
        <select
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
          className="hq-num border px-1.5 py-1 text-[11px]"
          style={{
            borderColor: "var(--hq-line)",
            background: "var(--hq-panel)",
            color: "var(--hq-text)",
          }}
        >
          <option value="all">All suppliers</option>
          {suppliers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name…"
          className="hq-num min-w-[10rem] flex-1 border px-2 py-1 text-[11px] outline-none"
          style={{
            borderColor: "var(--hq-line)",
            background: "var(--hq-panel)",
            color: "var(--hq-text)",
          }}
        />
        <span
          className="hq-num text-[11px]"
          style={{ color: "var(--hq-faint)" }}
        >
          {rows.length} shown
        </span>
      </div>

      <TopFindings findings={report.topFindings} />

      <div
        className="overflow-x-auto border"
        style={{ borderColor: "var(--hq-line)" }}
      >
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr
              style={{
                background: "var(--hq-panel)",
                color: "var(--hq-faint)",
              }}
            >
              <Th>Score</Th>
              <Th>Tier</Th>
              <Th className="text-left">Product</Th>
              <Th>Supplier</Th>
              <Th>Words</Th>
              <Th>Facts/100w</Th>
              <Th className="text-left">Worst problem</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-2 py-6 text-center text-[12px]"
                  style={{ color: "var(--hq-dim)" }}
                >
                  Nothing matches that filter.
                </td>
              </tr>
            ) : (
              rows
                .slice(0, 400)
                .map((product) => (
                  <Row
                    key={product.id}
                    product={product}
                    open={open === product.id}
                    onToggle={() =>
                      setOpen(open === product.id ? null : product.id)
                    }
                  />
                ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 400 ? (
        <p className="hq-num text-[11px]" style={{ color: "var(--hq-faint)" }}>
          Showing the worst 400 of {rows.length}. Narrow the filter to see more.
        </p>
      ) : null}
    </div>
  );
}

function Row({
  product,
  open,
  onToggle,
}: {
  product: ScoredProduct;
  open: boolean;
  onToggle: () => void;
}) {
  const worst =
    product.findings.find((f) => f.severity === "blocker") ??
    product.findings.find((f) => f.severity === "major") ??
    product.findings[0];

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer"
        style={{ borderTop: "1px solid var(--hq-line-soft)" }}
      >
        <Td>
          <span
            className="hq-num"
            style={{ color: scoreColour(product.overall) }}
          >
            {product.overall.toFixed(1)}
          </span>
        </Td>
        <Td>
          <span
            className="hq-num px-1 text-[10px]"
            style={{ color: tierColour(product.tier) }}
          >
            {product.tier}
          </span>
        </Td>
        <td className="px-2 py-1">
          <span style={{ color: "var(--hq-text)" }}>{product.title}</span>
          {!product.published ? (
            <span
              className="hq-num ml-1.5 text-[10px]"
              style={{ color: "var(--hq-faint)" }}
            >
              DRAFT
            </span>
          ) : null}
        </td>
        <Td muted>{product.supplier ?? "—"}</Td>
        <Td muted>{product.words || "—"}</Td>
        <Td>
          <span
            className="hq-num"
            style={{
              color:
                product.factsPer100 >= 1
                  ? "var(--hq-up)"
                  : product.factsPer100 > 0
                    ? "var(--hq-warn)"
                    : "var(--hq-down)",
            }}
          >
            {product.words ? product.factsPer100.toFixed(2) : "—"}
          </span>
        </Td>
        <td className="px-2 py-1" style={{ color: "var(--hq-dim)" }}>
          {worst ? worst.message : "—"}
        </td>
      </tr>
      {open ? (
        <tr style={{ background: "var(--hq-panel)" }}>
          <td colSpan={7} className="px-3 py-2">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {DIMENSIONS.map((d) => (
                <span key={d} className="hq-num text-[10.5px]">
                  <span style={{ color: "var(--hq-faint)" }}>
                    {DIMENSION_LABELS[d]}
                  </span>{" "}
                  <span style={{ color: scoreColour(product.scores[d]) }}>
                    {product.scores[d].toFixed(1)}
                  </span>
                </span>
              ))}
            </div>
            <ul className="mt-2 flex flex-col gap-0.5">
              {product.findings.map((finding, index) => (
                <li key={index} className="text-[11.5px]">
                  <span
                    className="hq-num mr-1.5 text-[10px]"
                    style={{ color: severityColour(finding.severity) }}
                  >
                    {finding.severity.toUpperCase()}
                  </span>
                  <span style={{ color: "var(--hq-dim)" }}>
                    {finding.message}
                  </span>
                </li>
              ))}
              {product.findings.length === 0 ? (
                <li className="text-[11.5px]" style={{ color: "var(--hq-up)" }}>
                  Nothing wrong with it.
                </li>
              ) : null}
            </ul>
            {product.slug ? (
              <a
                href={`/studio/structure/product;${product.id.replace("drafts.", "")}`}
                className="mt-2 inline-block text-[11px] underline"
                style={{ color: "var(--hq-accent)" }}
              >
                Open in Studio →
              </a>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Totals({ report }: { report: ReadinessReport }) {
  const { totals } = report;
  const cells: [string, number, string][] = [
    ["Gold", totals.gold, "var(--hq-up)"],
    ["Silver", totals.silver, "var(--hq-info)"],
    ["Review", totals.review, "var(--hq-warn)"],
    ["Unwritten drafts", totals.unwritten, "var(--hq-down)"],
    ["Published", totals.published, "var(--hq-text)"],
    ["Total", totals.all, "var(--hq-dim)"],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {cells.map(([label, value, colour]) => (
        <div
          key={label}
          className="border px-2.5 py-1.5"
          style={{
            borderColor: "var(--hq-line)",
            background: "var(--hq-panel)",
          }}
        >
          <div
            className="text-[9.5px] tracking-[0.14em] uppercase"
            style={{ color: "var(--hq-faint)" }}
          >
            {label}
          </div>
          <div className="hq-num text-[17px]" style={{ color: colour }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Medians({ medians }: { medians: Record<Dimension, number> }) {
  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-1 border px-2.5 py-2"
      style={{ borderColor: "var(--hq-line)", background: "var(--hq-panel)" }}
    >
      <span
        className="text-[9.5px] tracking-[0.14em] uppercase"
        style={{ color: "var(--hq-faint)" }}
      >
        Median, published
      </span>
      {DIMENSIONS.map((d) => (
        <span key={d} className="hq-num text-[11px]">
          <span style={{ color: "var(--hq-faint)" }}>
            {DIMENSION_LABELS[d]}
          </span>{" "}
          <span style={{ color: scoreColour(medians[d]) }}>
            {medians[d].toFixed(1)}
          </span>
        </span>
      ))}
    </div>
  );
}

function TopFindings({
  findings,
}: {
  findings: { message: string; count: number }[];
}) {
  if (findings.length === 0) return null;
  return (
    <div
      className="border px-2.5 py-2"
      style={{ borderColor: "var(--hq-line)", background: "var(--hq-panel)" }}
    >
      <div
        className="mb-1 text-[9.5px] tracking-[0.14em] uppercase"
        style={{ color: "var(--hq-faint)" }}
      >
        Most common problems, whole catalogue
      </div>
      <div className="flex flex-col gap-0.5">
        {findings.map((finding) => (
          <div key={finding.message} className="flex gap-2 text-[11.5px]">
            <span
              className="hq-num w-10 shrink-0 text-right"
              style={{ color: "var(--hq-accent)" }}
            >
              {finding.count}
            </span>
            <span style={{ color: "var(--hq-dim)" }}>{finding.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Group<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex" style={{ border: "1px solid var(--hq-line)" }}>
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className="hq-num px-2 py-1 text-[11px]"
          style={{
            background:
              value === option ? "var(--hq-panel-raised)" : "transparent",
            color: value === option ? "var(--hq-accent)" : "var(--hq-faint)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-1 text-[9.5px] font-medium tracking-[0.12em] uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className="hq-num px-2 py-1 text-center whitespace-nowrap"
      style={{ color: muted ? "var(--hq-faint)" : undefined }}
    >
      {children}
    </td>
  );
}

function scoreColour(score: number): string {
  if (score >= 8.5) return "var(--hq-up)";
  if (score >= 7) return "var(--hq-info)";
  if (score >= 5.5) return "var(--hq-warn)";
  return "var(--hq-down)";
}

function tierColour(tier: ScoredProduct["tier"]): string {
  return tier === "GOLD"
    ? "var(--hq-up)"
    : tier === "SILVER"
      ? "var(--hq-info)"
      : "var(--hq-warn)";
}

function severityColour(severity: string): string {
  return severity === "blocker"
    ? "var(--hq-down)"
    : severity === "major"
      ? "var(--hq-warn)"
      : "var(--hq-faint)";
}
