/**
 * Reusable GROQ projection fragments, interpolated into the query strings in
 * this folder. Kept as plain template strings (not a query builder) to stay
 * close to what Sanity's own docs and Vision tool show, which keeps queries
 * easy to paste into Vision for debugging.
 */

/** Resolves a `link` object to a flat { label, href }. */
export const LINK_PROJECTION = `{
  label,
  "href": select(
    linkType == "external" => externalUrl,
    linkType == "internal" => select(
      internalRef->_type == "category" => "/shop/" + internalRef->slug.current,
      internalRef->_type == "department" => "/shop/room/" + internalRef->slug.current,
      internalRef->_type == "collection" => "/collections/" + internalRef->slug.current,
      internalRef->_type == "product" => "/shop/" + internalRef->category->slug.current + "/" + internalRef->slug.current,
      internalRef->_type == "page" => "/" + internalRef->slug.current,
      internalRef->_type == "post" => "/journal/" + internalRef->slug.current,
      internalRef->_type == "buyingGuide" => "/learn/" + internalRef->slug.current,
      "/"
    ),
    "/"
  )
}`;

/**
 * A product referenced by an article, resolved to everything needed to render a
 * followable link to it.
 *
 * Articles used to project the slug alone, which made the reference invisible on
 * the page: an article could say it was about eleven bedside tables without linking
 * to one of them. An editorial link is the link type Google weighs most, and 96 of
 * 99 products had none, so the projection now carries what a card needs.
 */
export const ARTICLE_PRODUCT_PROJECTION = `{
  "slug": slug.current,
  title,
  "category": category->slug.current,
  price,
  "image": gallery[0].asset->url
}`;

/**
 * The SEO override object every content type carries.
 *
 * It existed on five schemas and **no query read it**, so every meta title and meta
 * description an editor had written was decorative — the pages derived their own from
 * the product name and summary instead. Projected here so a filled field is actually
 * the one that ships.
 */
export const SEO_PROJECTION = `{
  metaTitle,
  metaDescription,
  "ogImage": ogImage.asset->url
}`;

export const PRODUCT_SPEC_PROJECTION = `{ label, value }`;
export const PRODUCT_OPTION_PROJECTION = `{ label, values }`;
export const FAQ_ENTRY_PROJECTION = `{ question, answer }`;
