"use server";

import "server-only";

import {
  type Dimension,
  DIMENSIONS,
  type Grade,
  type QualityResult,
  scoreProduct,
  type Tier,
} from "@/lib/catalog/quality";
import {
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "@/lib/catalog/quality-input";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import { getSanityWriteClient } from "@/server/sanity/write-client";

/**
 * The live product readiness list.
 *
 * Scores the catalogue with the same engine as
 * `scripts/audit-product-quality.ts`, so the screen and the written audit can
 * never disagree. Drafts are included deliberately: 674 of them have no
 * description at all, and a readiness screen that hid the unwritten half would
 * be reporting on the easy part of the problem.
 */

export interface ScoredProduct {
  id: string;
  title: string;
  slug: string | null;
  supplier: string | null;
  category: string | null;
  createdAt: string;
  published: boolean;
  price: number | null;
  overall: number;
  grade: Grade;
  tier: Tier;
  words: number;
  factsPer100: number;
  scores: Record<Dimension, number>;
  findings: QualityResult["findings"];
}

export interface ReadinessReport {
  products: ScoredProduct[];
  totals: {
    all: number;
    published: number;
    drafts: number;
    gold: number;
    silver: number;
    review: number;
    /** Drafts carrying no description at all — the unwritten backlog. */
    unwritten: number;
  };
  /** Median score per dimension across published products, for the strip. */
  medians: Record<Dimension, number>;
  /** The most common findings, worst first. */
  topFindings: { message: string; count: number }[];
  generatedAt: string;
}

const EMPTY: ReadinessReport = {
  products: [],
  totals: {
    all: 0,
    published: 0,
    drafts: 0,
    gold: 0,
    silver: 0,
    review: 0,
    unwritten: 0,
  },
  medians: Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<
    Dimension,
    number
  >,
  topFindings: [],
  generatedAt: new Date().toISOString(),
};

type Row = ProductDocument & { _createdAt: string };

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export async function getReadiness(): Promise<ReadinessReport> {
  if (!(await getAuthorizedAdmin())) return EMPTY;

  // The token client, not the public one: drafts are the point of this screen
  // and the public client carries no token, so it would return only the 237
  // published products and silently hide the unwritten backlog.
  const client = getSanityWriteClient();
  if (!client) return EMPTY;

  let rows: Row[] = [];
  try {
    rows = await client.fetch<Row[]>(
      `*[_type == "product"] ${QUALITY_PROJECTION} | order(_createdAt desc)`,
    );
  } catch (error) {
    console.error("[readiness] could not read the catalogue:", error);
    return EMPTY;
  }

  const products: ScoredProduct[] = (rows ?? []).map((doc) => {
    const result = scoreProduct(toQualityInput(doc));
    return {
      id: doc._id,
      title: doc.title ?? "(untitled)",
      slug: doc.slug ?? null,
      supplier: doc.supplier ?? null,
      category: doc.category ?? null,
      createdAt: doc._createdAt,
      published: !doc._id.startsWith("drafts."),
      price: doc.price ?? null,
      overall: result.overall,
      grade: result.grade,
      tier: result.tier,
      words: result.stats.words,
      factsPer100: result.stats.factsPer100,
      scores: result.scores,
      findings: result.findings,
    };
  });

  const published = products.filter((p) => p.published);
  const tally = new Map<string, number>();
  for (const product of products) {
    for (const finding of product.findings) {
      // Grouped by the shape of the message so "312 words" and "980 words" are
      // one row rather than two hundred.
      const key = finding.message
        .replace(/\d+(?:\.\d+)?/g, "N")
        .replace(/“[^”]*”/g, "…")
        .replace(/\(e\.g\.[^)]*\)/g, "");
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }

  return {
    products,
    totals: {
      all: products.length,
      published: published.length,
      drafts: products.length - published.length,
      gold: products.filter((p) => p.tier === "GOLD").length,
      silver: products.filter((p) => p.tier === "SILVER").length,
      review: products.filter((p) => p.tier === "REVIEW").length,
      unwritten: products.filter((p) => !p.published && p.words === 0).length,
    },
    medians: Object.fromEntries(
      DIMENSIONS.map((d) => [d, median(published.map((p) => p.scores[d]))]),
    ) as Record<Dimension, number>,
    topFindings: [...tally]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([message, count]) => ({ message: message.trim(), count })),
    generatedAt: new Date().toISOString(),
  };
}
