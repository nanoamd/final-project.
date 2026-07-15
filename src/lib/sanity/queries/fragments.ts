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
      internalRef->_type == "department" => "/shop",
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

export const PRODUCT_SPEC_PROJECTION = `{ label, value }`;
export const PRODUCT_OPTION_PROJECTION = `{ label, values }`;
export const FAQ_ENTRY_PROJECTION = `{ question, answer }`;
