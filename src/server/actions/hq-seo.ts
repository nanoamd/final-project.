"use server";

import "server-only";

import { createClient } from "@sanity/client";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";
import { getAuthorizedAdmin } from "@/server/auth/admin";

/**
 * SEO & Site Health (docs/kaiku-hq-design.md §4.12).
 *
 * Two of the design doc's three bands need infrastructure that does not
 * exist yet and would be dishonest to fake: the GSC band needs a connected
 * service account (renders its connect instructions instead, per the design
 * doc's own edge case — "not fake zeros"), and the nightly crawler needs a
 * `site_issues` table and a Vercel cron this session did not add. What is
 * real today, computed live from Sanity rather than stored: thin
 * descriptions, missing meta descriptions, and images missing alt text —
 * exactly the gaps the "improve product descriptions" half of this session's
 * brief is about, so this page doubles as that work's own checklist.
 */

const sanity = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});

const THIN_THRESHOLD = 300;

interface Block {
  _type?: string;
  children?: { text?: string }[];
}

function blockText(blocks: Block[] | null): string {
  return (blocks ?? [])
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .join(" ")
    .trim();
}

export interface SeoIssueRow {
  slug: string;
  title: string;
  status: "draft" | "live";
  descriptionLength: number;
  hasMetaDescription: boolean;
  imagesMissingAlt: number;
}

export interface SeoData {
  totalProducts: number;
  thinDescriptions: SeoIssueRow[];
  missingMetaDescription: SeoIssueRow[];
  missingAltText: SeoIssueRow[];
}

const EMPTY: SeoData = {
  totalProducts: 0,
  thinDescriptions: [],
  missingMetaDescription: [],
  missingAltText: [],
};

export async function getSeoHealth(): Promise<SeoData> {
  if (!(await getAuthorizedAdmin())) return EMPTY;

  const docs = await sanity.fetch<
    {
      _id: string;
      slug: string;
      title: string;
      description: Block[] | null;
      metaDescription: string | null;
      gallery: { alt?: string | null }[] | null;
    }[]
  >(
    `*[_type == "product"]{
      _id,
      "slug": slug.current,
      title,
      description,
      "metaDescription": seo.metaDescription,
      "gallery": gallery[]{ alt }
    }`,
  );

  const rows: SeoIssueRow[] = docs.map((doc) => {
    const length = blockText(doc.description).length;
    const missingAlt = (doc.gallery ?? []).filter(
      (img) => !img.alt?.trim(),
    ).length;
    return {
      slug: doc.slug,
      title: doc.title,
      status: doc._id.startsWith("drafts.") ? "draft" : "live",
      descriptionLength: length,
      hasMetaDescription: Boolean(doc.metaDescription?.trim()),
      imagesMissingAlt: missingAlt,
    };
  });

  return {
    totalProducts: rows.length,
    thinDescriptions: rows
      .filter((r) => r.descriptionLength < THIN_THRESHOLD)
      .sort((a, b) => a.descriptionLength - b.descriptionLength),
    missingMetaDescription: rows.filter((r) => !r.hasMetaDescription),
    missingAltText: rows.filter((r) => r.imagesMissingAlt > 0),
  };
}
