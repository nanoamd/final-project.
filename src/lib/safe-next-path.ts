/**
 * Sanitises a `?next=` redirect target.
 *
 * Checkout requires an account, so signing in has to be able to send a customer
 * back where they were — and the only place that destination can come from is
 * the URL, which anyone can write. An unchecked `next` is an open redirect: a
 * link to our own login page that lands the customer somewhere else entirely,
 * which is exactly the shape a phishing link wants.
 *
 * So: only same-site absolute paths survive. Everything else falls back.
 */
export function safeNextPath(
  value: string | string[] | undefined,
  fallback = "/account",
): string {
  // Repeated params (`?next=/cart&next=//evil.example`) arrive as an array.
  // Nothing legitimate does that, so refuse rather than pick one.
  if (typeof value !== "string") return fallback;

  const path = value.trim();
  if (!path.startsWith("/")) return fallback;

  // `//evil.example` and `/\evil.example` are protocol-relative URLs: the
  // browser treats both as another origin despite the leading slash.
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;

  // Newlines and other control characters can split a header or smuggle a
  // second target past a parser more forgiving than this one. Checked by code
  // point rather than a regex so no literal control character has to appear in
  // this file to describe them.
  for (const char of path) {
    const code = char.codePointAt(0)!;
    if (code < 0x20 || code === 0x7f) return fallback;
  }

  return path;
}
