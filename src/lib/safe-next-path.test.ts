import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps a same-site path", () => {
    expect(safeNextPath("/cart")).toBe("/cart");
    expect(safeNextPath("/shop/saunas/nordic-two-seater")).toBe(
      "/shop/saunas/nordic-two-seater",
    );
  });

  it("keeps a query string and hash on a same-site path", () => {
    expect(safeNextPath("/shop?sort=price#top")).toBe("/shop?sort=price#top");
  });

  it("falls back when absent", () => {
    expect(safeNextPath(undefined)).toBe("/account");
  });

  it("uses the caller's fallback", () => {
    expect(safeNextPath(undefined, "/cart")).toBe("/cart");
  });

  it("refuses an absolute URL to another origin", () => {
    expect(safeNextPath("https://evil.example/phish")).toBe("/account");
    expect(safeNextPath("http://evil.example")).toBe("/account");
  });

  it("refuses a protocol-relative URL", () => {
    expect(safeNextPath("//evil.example/phish")).toBe("/account");
    expect(safeNextPath("/\\evil.example/phish")).toBe("/account");
  });

  it("refuses something that is not a path at all", () => {
    expect(safeNextPath("javascript:alert(1)")).toBe("/account");
    expect(safeNextPath("data:text/html,<script>")).toBe("/account");
  });

  it("refuses a bare relative path", () => {
    expect(safeNextPath("cart")).toBe("/account");
    expect(safeNextPath("../admin")).toBe("/account");
  });

  it("refuses control characters", () => {
    expect(safeNextPath("/cart\nLocation: https://evil.example")).toBe(
      "/account",
    );
    expect(safeNextPath("/cart\r\nSet-Cookie: x=1")).toBe("/account");
    expect(safeNextPath("/ca\trt")).toBe("/account");
    // DEL, built rather than typed so no literal control character lands in
    // this file.
    expect(safeNextPath(`/ca${String.fromCharCode(127)}rt`)).toBe("/account");
  });

  it("allows a trailing newline, because trim removes it first", () => {
    // Not a smuggled header — after trimming there is nothing left but a
    // perfectly ordinary path, so refusing it would only break a legitimate
    // link that picked up whitespace in an email client.
    expect(safeNextPath("/cart\r\n")).toBe("/cart");
  });

  it("refuses a repeated param delivered as an array", () => {
    expect(safeNextPath(["/cart", "//evil.example"])).toBe("/account");
  });

  it("trims surrounding whitespace before deciding", () => {
    expect(safeNextPath("  /cart  ")).toBe("/cart");
    expect(safeNextPath("  //evil.example")).toBe("/account");
  });
});
