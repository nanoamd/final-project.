/**
 * Reading and tidying the free-text delivery lead times.
 *
 * Lives here rather than in the audit script because two scripts need it, and a
 * script that runs `main()` at module scope cannot be imported — doing that made
 * the normaliser print the whole audit report before doing anything.
 */

/**
 * A lead time reduced to a span of days, or null when it cannot be read.
 *
 * The values are free text, so "7-10 days", "7–10 days", "7 to 10 days" and
 * "1-2 weeks" are four strings meaning roughly two things. Grouping on the raw
 * string reports a tidy list of unique values and hides the actual
 * inconsistency; grouping on the parsed span is what surfaces it.
 */
export function parseLeadTime(
  raw: string | null,
): { min: number; max: number } | null {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(/[–—]/g, "-");
  const unit = /week/.test(text) ? 7 : /month/.test(text) ? 30 : 1;

  const range = text.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
  if (range)
    return { min: Number(range[1]) * unit, max: Number(range[2]) * unit };

  const plus = text.match(/(\d+)\s*\+/);
  if (plus) {
    // An open-ended promise. Recorded as min..min so it groups with its own
    // floor rather than inventing a ceiling the copy does not give.
    const n = Number(plus[1]) * unit;
    return { min: n, max: n };
  }

  const single = text.match(/(\d+)/);
  if (single) {
    const n = Number(single[1]) * unit;
    return { min: n, max: n };
  }

  return null;
}

/**
 * Punctuation only: collapse whitespace, trim, and use an en dash between
 * digits.
 *
 * En dash because that is what a numeric range takes typographically, and
 * because most of the catalogue and the copy in `docs/` already use it. A hyphen
 * inside a word — "thermo-treated" — is untouched, which is why the substitution
 * requires a digit on both sides.
 */
export function normaliseLeadTime(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(\d)\s*[-–—]\s*(\d)/g, "$1–$2");
}

/** Short label for a span: "3w–4w", "2d–5d". */
export function leadTimeLabel(span: { min: number; max: number }): string {
  const weeks = (d: number) => `${(d / 7).toFixed(d % 7 === 0 ? 0 : 1)}w`;
  const fmt = (d: number) => (d >= 14 ? weeks(d) : `${d}d`);
  return span.min === span.max
    ? fmt(span.min)
    : `${fmt(span.min)}–${fmt(span.max)}`;
}
