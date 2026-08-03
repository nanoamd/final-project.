/**
 * SUPERSEDED — do not use this to delete anything.
 *
 * This script used to target a product titled "Kaiku Horizon Cabin Sauna",
 * believing it to be a stray fake/placeholder product. It wasn't one: that
 * title (and SKU "KAI-HRZN") had been mistakenly written onto the REAL,
 * live "Auroom Horizon Sauna" product (_id: product-auroom-horizon-sauna,
 * £6,995, referenced from the homepage) — a data-corruption bug, not a
 * duplicate document. Sanity's reference-integrity check correctly
 * blocked every delete attempt made with this script, so nothing was ever
 * actually lost.
 *
 * The real fix is scripts/fix-auroom-sauna-title.ts, which restores the
 * correct title/SKU on that same document instead of deleting it. Run
 * that one instead — this file is left in place only so old instructions
 * pointing at it don't 404; it intentionally does nothing.
 */
console.log(
  "This script has been superseded — nothing was deleted. Run scripts/fix-auroom-sauna-title.ts instead, which restores the correct title/SKU on the real Auroom Horizon Sauna product.",
);
