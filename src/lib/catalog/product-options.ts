/**
 * Tells a real product choice apart from a description of one product.
 *
 * A multi-value `Colour` option in this catalogue means one of two completely
 * different things, and until now the product page treated both the same way.
 *
 * **A choice.** The Abberley chest of drawers is sold in White, Black and Brown,
 * and each has its own photograph. Picking one is a real decision that changes
 * what arrives, and it belongs in the basket line.
 *
 * **A description.** The Neatham table's option list reads Black, Brass, Gold —
 * Damien's words: *"bronze brass etc aren't actual variants it's just the
 * different colours of one product"*. It is one table: a black top on brass-gold
 * legs. There is no gold Neatham to order.
 *
 * Rendering the second kind as a row of buttons invites a choice that does not
 * exist, and the selection was being written into the basket item and from there
 * into the order record — so a customer could order a "Gold" table that has never
 * existed, and nothing in the system would contradict them. That is worse than a
 * mis-tagged filter, because it reaches fulfilment.
 *
 * **How they are told apart: whether the gallery photographs more than one of the
 * values.** That is the only signal in the data that distinguishes them, and it is
 * a good one — a genuine variant needs its own photograph to be sellable at all,
 * and every one of the 21 products with a real colour choice has them. The 10
 * without all read as descriptions of a single object: `[Grey | Oak]` on a
 * grey-aged oak console, `[Brown | Neutral | Taupe]` on a gesso lamp.
 *
 * **Where it errs, and why that is the right direction.** A genuine variant nobody
 * has photographed yet will be read as a description, and stop being selectable.
 * That is the safe failure: it under-sells a variant rather than taking an order
 * for something that cannot ship, and the fix is to tag the photograph with its
 * `optionValue` — which is what makes the variant sellable in the first place,
 * since that tag is what swaps the picture when a shopper picks a colour.
 *
 * Non-colour options are always a choice. A Size of 60cm or 80cm is a decision
 * whatever the photographs show.
 */

/** The shape needed from an option — matches SanityProduct's `options`. */
export interface ProductOptionLike {
  label: string;
  values: string[];
}

/** The shape needed from a gallery image. */
export interface GalleryImageLike {
  optionValue?: string | null;
}

/** Labels that name a colour or finish rather than a dimension or a fitting. */
const COLOUR_LABEL = /colour|color|finish|shade/i;

export function isColourOption(option: ProductOptionLike): boolean {
  return COLOUR_LABEL.test(option.label);
}

/**
 * Option values compare case- and whitespace-insensitively.
 *
 * The catalogue's option values carry trailing spaces (`"White "`, `"Ivory "`) and
 * inconsistent case, the same stray whitespace already found on the SKUs and the
 * delivery lead times. An exact-match test here would classify a properly
 * photographed variant as a description and quietly remove a real choice.
 */
function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Whether this option is a choice the shopper makes, rather than a description of
 * the one product.
 */
export function isSelectableOption(
  option: ProductOptionLike,
  gallery: readonly GalleryImageLike[],
): boolean {
  if (!isColourOption(option)) return true;

  const values = new Set(option.values.map(normalise));
  const photographed = new Set(
    gallery
      .map((image) => image.optionValue)
      .filter((value): value is string => Boolean(value))
      .map(normalise)
      .filter((value) => values.has(value)),
  );

  return photographed.size > 1;
}

/**
 * The options a shopper actually chooses between — what the buy box should offer
 * and what belongs on the basket line.
 */
export function selectableOptions<T extends ProductOptionLike>(
  options: readonly T[] | null | undefined,
  gallery: readonly GalleryImageLike[],
): T[] {
  return (options ?? []).filter((option) =>
    isSelectableOption(option, gallery),
  );
}

/**
 * The options that describe the product rather than offering a choice — shown as
 * a statement of the colours the piece has.
 */
export function descriptiveOptions<T extends ProductOptionLike>(
  options: readonly T[] | null | undefined,
  gallery: readonly GalleryImageLike[],
): T[] {
  return (options ?? []).filter(
    (option) => !isSelectableOption(option, gallery),
  );
}

/**
 * "Black, brass and gold" — the colours of one piece, read as a sentence.
 *
 * Lower-cased because these run inside a line of prose rather than as labels, and
 * a value that is already capitalised mid-list ("Sky Blue") reads as a variant
 * name rather than a description of the object.
 */
export function describeValues(values: readonly string[]): string {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  if (cleaned.length <= 1) return cleaned[0] ?? "";
  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned[cleaned.length - 1]}`;
}
