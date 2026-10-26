import { describe, expect, it } from "vitest";

import { cleanEmail } from "./checkout";

/**
 * This exists to stop one thing: handing Stripe a `customer_email` it rejects,
 * which would turn a checkout into an error for a customer who was only trying
 * to be helpful. It is a convenience filter, not an identity check — Stripe
 * validates properly on its own page.
 */
describe("cleanEmail", () => {
  it("passes an ordinary address through, trimmed", () => {
    expect(cleanEmail("  someone@example.com  ")).toBe("someone@example.com");
  });

  it("keeps the shapes real addresses actually take", () => {
    for (const email of [
      "first.last@example.co.uk",
      "someone+kaiku@gmail.com",
      "a@b.co",
      "O'Brien@example.com",
    ])
      expect(cleanEmail(email)).toBe(email);
  });

  it("drops anything Stripe would reject, rather than passing it on", () => {
    for (const bad of [
      "not an email",
      "missing-at.example.com",
      "two@@example.com",
      "spaces in@example.com",
      "@example.com",
      "someone@",
      "someone@nodot",
    ])
      expect(cleanEmail(bad)).toBeUndefined();
  });

  it("treats blank and absent the same, so Stripe collects it as before", () => {
    for (const nothing of ["", "   ", undefined])
      expect(cleanEmail(nothing)).toBeUndefined();
  });

  it("refuses an address longer than the RFC maximum", () => {
    expect(cleanEmail(`${"a".repeat(250)}@example.com`)).toBeUndefined();
  });
});
