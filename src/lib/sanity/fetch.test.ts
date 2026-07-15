import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

const { sanityFetch } = await import("@/lib/sanity/fetch");

describe("sanityFetch (fail-soft contract)", () => {
  it("returns the query result on success", async () => {
    fetchMock.mockResolvedValueOnce({ title: "Kaiku" });
    const result = await sanityFetch("*", {}, null);
    expect(result).toEqual({ title: "Kaiku" });
  });

  it("returns the fallback when the client throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network error"));
    const result = await sanityFetch("*", {}, "fallback-value");
    expect(result).toBe("fallback-value");
  });

  it("returns the fallback when the query resolves null", async () => {
    fetchMock.mockResolvedValueOnce(null);
    const result = await sanityFetch("*", {}, []);
    expect(result).toEqual([]);
  });

  it("never throws, even on a rejected promise", async () => {
    fetchMock.mockRejectedValueOnce(new Error("misconfigured project ID"));
    await expect(sanityFetch("*", {}, [])).resolves.not.toThrow();
  });
});
