/**
 * Who actually made the thing, decided from the barcode rather than from us.
 *
 * ## The contradiction this fixes
 *
 * 899 of 908 products declare brand "Kaiku", and 728 of those also carry a
 * GTIN. A GTIN is not a free-floating number: it is issued to one company by
 * GS1, and the leading digits — the company prefix — identify that company.
 * Every barcode in this catalogue was registered by a supplier, never by
 * Kaiku, because Kaiku has never registered one.
 *
 * So the feed was telling Google two things that cannot both be true: that the
 * brand is Kaiku, and that the product carries a barcode belonging to Hill
 * Interiors. Google validates that pair. A mismatch is a documented
 * disapproval reason, and — the part that costs more — it stops the item
 * matching the catalogue entry every other retailer lists against, which is
 * how a free listing gets shown for a generic product search at all.
 *
 * ## Why the prefix decides it and the supplier does not
 *
 * The obvious fix is "use the supplier's name as the brand". It is wrong often
 * enough to matter: a dropshipper is not a manufacturer, and several of ours
 * carry other companies' goods. The company prefix is the actual registrant,
 * which is the thing Google checks. Grouping all 729 GTINs by prefix gave a
 * clean answer:
 *
 * | Prefix    | Products | Registrant                                      |
 * | --------- | -------: | ----------------------------------------------- |
 * | `5018705` |      489 | Premier Housewares                              |
 * | `5050140` |      128 | Hill Interiors — every Hill product, one prefix  |
 * | `5063227` |       57 | Premier Housewares, second prefix                |
 * | `5056368` |       43 | Ancient Wisdom ("AW Dropship")                   |
 * | `5055796` |        8 | Ancient Wisdom — confirmed by the product titles |
 * | `5056422` |        3 | Ancient Wisdom                                   |
 * | `5061121` |        1 | SaunaPlunge                                      |
 *
 * All seven begin `50`, which is GS1 UK — consistent with British wholesalers
 * registering their own lines.
 *
 * `AW Dropship` is Ancient Wisdom, and that is not a guess: eight of their
 * products carry "| Ancient Wisdom |" in the title Damien wrote, and those
 * eight sit on prefix `5055796`. The other two prefixes arrive through the
 * same supplier account.
 *
 * ## What happens to a prefix that is not in the table
 *
 * The GTIN is dropped and the item declares `identifier_exists: no`.
 *
 * That is deliberate, and it is the conservative half of this module. Sending
 * a **wrong** brand next to a real GTIN recreates exactly the mismatch this
 * exists to remove, so an unrecognised registrant is not worth guessing at.
 * Dropping the barcode loses product matching for that item and keeps it
 * servable, which is the better of the two failures.
 *
 * ## What this does not touch
 *
 * The storefront. `brand` in Sanity still says Kaiku, the product page still
 * reads as a Kaiku shop, and no product name changes. This resolves what the
 * **feed and the structured data** tell Google about who manufactured the item,
 * which is a question of fact rather than of positioning.
 */

/** GS1 company prefix → the company that registered it. */
const REGISTRANT_BY_PREFIX: Readonly<Record<string, string>> = {
  "5018705": "Premier Housewares",
  "5063227": "Premier Housewares",
  "5050140": "Hill Interiors",
  "5056368": "Ancient Wisdom",
  "5055796": "Ancient Wisdom",
  "5056422": "Ancient Wisdom",
  "5061121": "SaunaPlunge",
};

/**
 * How many leading digits to read as the company prefix.
 *
 * GS1 company prefixes are 7 to 10 digits and the length is not encoded in the
 * barcode, so it cannot be derived — but seven is enough to separate every
 * registrant in this catalogue, and a longer read would split one company's
 * range across several keys.
 */
const PREFIX_LENGTH = 7;

export interface ProductIdentifiers {
  /** The brand as Sanity holds it — almost always "Kaiku". */
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
}

export interface ResolvedIdentity {
  /** What `<g:brand>` and schema.org `brand` should say. */
  brand: string | null;
  /** The GTIN to send, or `null` when it must not be sent. */
  gtin: string | null;
  mpn: string | null;
  /** False when the feed must declare `identifier_exists: no`. */
  identifierExists: boolean;
}

/** The registrant of a GTIN, or `null` if the prefix is not one we know. */
export function registrantForGtin(gtin: string | null): string | null {
  const digits = gtin?.trim();
  if (!digits || !/^[0-9]+$/.test(digits)) return null;
  return REGISTRANT_BY_PREFIX[digits.slice(0, PREFIX_LENGTH)] ?? null;
}

/**
 * Decides the brand, GTIN and `identifier_exists` a product should advertise.
 *
 * Three outcomes, and only the first is a win:
 *
 * 1. **Known registrant** — send their name as the brand, keep the GTIN. The
 *    pair is now consistent and the item can match.
 * 2. **GTIN from an unknown registrant** — drop the GTIN, keep our brand, and
 *    declare no identifier. Consistent, servable, unmatched.
 * 3. **No GTIN at all** — unchanged from before: our brand, and
 *    `identifier_exists` turns on an MPN if one exists.
 */
export function resolveIdentity(product: ProductIdentifiers): ResolvedIdentity {
  const gtin = product.gtin?.trim() || null;
  const mpn = product.mpn?.trim() || null;

  if (!gtin) {
    return {
      brand: product.brand,
      gtin: null,
      mpn,
      identifierExists: Boolean(mpn),
    };
  }

  const registrant = registrantForGtin(gtin);
  if (registrant) {
    return { brand: registrant, gtin, mpn, identifierExists: true };
  }

  // Unknown registrant. Asserting a brand here would rebuild the mismatch.
  return {
    brand: product.brand,
    gtin: null,
    mpn,
    identifierExists: Boolean(mpn),
  };
}
