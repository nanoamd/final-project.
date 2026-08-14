import { describe, expect, it } from "vitest";

import { buildMetadata } from "./metadata";

/**
 * These cover the SEO override path specifically.
 *
 * The `seo` field group existed on five Sanity schemas and **no query read it** — every
 * page derived its own title and description from the product name and summary, so
 * every meta description in the dataset was decorative. That is the kind of bug that
 * survives for months because nothing looks broken, which is exactly what a test is
 * for.
 */
describe("buildMetadata", () => {
  const base = {
    title: "Neatham End Table | Kaiku",
    description: "Derived from the product summary.",
    path: "/shop/side-tables/neatham-end-table",
  };

  it("prefers the document's own meta description", () => {
    const meta = buildMetadata({
      ...base,
      seo: {
        metaDescription:
          "End table with a faux concrete top and slim brass legs, 40cm square and 60cm high.",
      },
    });
    expect(meta.description).toBe(
      "End table with a faux concrete top and slim brass legs, 40cm square and 60cm high.",
    );
    expect(meta.openGraph?.description).toBe(meta.description);
    expect(meta.twitter?.description).toBe(meta.description);
  });

  it("prefers the document's own meta title", () => {
    const meta = buildMetadata({
      ...base,
      seo: { metaTitle: "Kitchen Storage | Kaiku" },
    });
    // Already branded, so it opts out of the layout's "%s — Kaiku" template rather
    // than rendering "… | Kaiku — Kaiku".
    expect(meta.title).toEqual({ absolute: "Kitchen Storage | Kaiku" });
  });

  it("falls back to the derived values when the fields are empty", () => {
    for (const seo of [
      undefined,
      null,
      {},
      { metaTitle: null, metaDescription: null },
      // An editor who opened the field and left a space has not written an override.
      { metaTitle: "   ", metaDescription: "  " },
    ]) {
      const meta = buildMetadata({ ...base, seo });
      expect(meta.description).toBe("Derived from the product summary.");
      expect(meta.title).toEqual({ absolute: "Neatham End Table | Kaiku" });
    }
  });

  it("uses the share image override ahead of the page image", () => {
    const meta = buildMetadata({
      ...base,
      image: "https://cdn.sanity.io/images/product.jpg",
      seo: { ogImage: "https://cdn.sanity.io/images/social.jpg" },
    });
    expect(meta.openGraph?.images).toEqual([
      { url: "https://cdn.sanity.io/images/social.jpg" },
    ]);
    expect(meta.twitter?.images).toEqual([
      "https://cdn.sanity.io/images/social.jpg",
    ]);
  });

  it("still appends the brand to a title that does not carry it", () => {
    const meta = buildMetadata({
      ...base,
      title: "Bedside Tables",
      seo: null,
    });
    expect(meta.title).toBe("Bedside Tables");
    expect(meta.openGraph?.title).toBe("Bedside Tables — Kaiku");
  });

  it("canonicalises to the site URL and keeps noindex working", () => {
    const meta = buildMetadata({ ...base, noindex: true });
    expect(meta.alternates?.canonical).toMatch(
      /\/shop\/side-tables\/neatham-end-table$/,
    );
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
