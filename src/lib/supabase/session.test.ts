import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { hasSupabaseAuthCookie } from "./session";

function requestWith(cookies: Record<string, string>) {
  const request = new NextRequest("https://www.kaikuhome.com/shop/mirrors");
  for (const [name, value] of Object.entries(cookies))
    request.cookies.set(name, value);
  return request;
}

describe("hasSupabaseAuthCookie", () => {
  it("is false for an anonymous request", () => {
    // Every crawler, every first-time visitor. This is the common case, and
    // the one that was paying for a Supabase round-trip to learn nothing.
    expect(hasSupabaseAuthCookie(requestWith({}))).toBe(false);
  });

  it("is false when only unrelated cookies are present", () => {
    expect(
      hasSupabaseAuthCookie(
        requestWith({ cart: "abc", "vercel-analytics": "1", locale: "en-GB" }),
      ),
    ).toBe(false);
  });

  it("is true for a standard Supabase auth cookie", () => {
    expect(
      hasSupabaseAuthCookie(
        requestWith({ "sb-uuqexxzwvruhpjcrygjn-auth-token": "token" }),
      ),
    ).toBe(true);
  });

  it("is true for a chunked auth cookie", () => {
    // Supabase splits large tokens across numbered cookies.
    expect(
      hasSupabaseAuthCookie(
        requestWith({
          "sb-uuqexxzwvruhpjcrygjn-auth-token.0": "part-one",
          "sb-uuqexxzwvruhpjcrygjn-auth-token.1": "part-two",
        }),
      ),
    ).toBe(true);
  });

  it("is not fooled by a cookie that merely starts with sb-", () => {
    expect(
      hasSupabaseAuthCookie(requestWith({ "sb-something-else": "x" })),
    ).toBe(false);
  });
});
