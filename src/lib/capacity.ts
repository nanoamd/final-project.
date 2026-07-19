/**
 * Parses a product's freeform "Capacity" spec value (e.g. "2–3 people",
 * "4 people", "2–8 people (by size)") into a numeric range. Real capacity
 * specs in Sanity are consistently phrased this way — free text, not a
 * structured field — so this only needs to pull the numbers out, not handle
 * arbitrary prose. Returns null if the text has no digits to parse.
 */
export function parseCapacityRange(
  value: string,
): { min: number; max: number } | null {
  const numbers = value.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  const parsed = numbers.map(Number);
  return { min: Math.min(...parsed), max: Math.max(...parsed) };
}
