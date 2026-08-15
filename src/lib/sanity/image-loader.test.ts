import { describe, expect, it } from "vitest";

import sanityImageLoader from "./image-loader";

const ASSET =
  "https://cdn.sanity.io/images/huh1e45n/production/e9c281ea5d69e5f092ede6cb0461c86738f9e8ee-2000x2000.jpg";

const params = (url: string) => new URL(url).searchParams;

describe("sanityImageLoader", () => {
  it("asks Sanity for the width Next requested", () => {
    const out = params(sanityImageLoader({ src: ASSET, width: 640 }));
    expect(out.get("w")).toBe("640");
    expect(out.get("q")).toBe("75");
    expect(out.get("auto")).toBe("format");
  });

  it("keeps the aspect ratio when the URL already pairs w with h", () => {
    /**
     * The bug this test exists for. `resolveCardImageUrl` asks Sanity for 1000×1250
     * so a 4:5 card gets a 4:5 crop around the editor's hotspot. Next then asks for
     * 640px. Overwriting w and leaving h at 1250 requests a 640×1250 crop — a tall,
     * narrow slice of the product.
     */
    const out = params(
      sanityImageLoader({
        src: `${ASSET}?w=1000&h=1250&fit=crop`,
        width: 640,
      }),
    );
    expect(out.get("w")).toBe("640");
    expect(out.get("h")).toBe("800"); // 640 × (1250/1000)
    expect(out.get("fit")).toBe("crop");
  });

  it("preserves a rect, so a tightened hero crop survives", () => {
    // scripts/tighten-hero-crops.ts stores square crops that reach the URL as rect.
    // Dropping it would undo the crop on every card at once.
    const out = params(
      sanityImageLoader({
        src: `${ASSET}?rect=55,78,1875,1875&w=1000&h=1250&fit=crop`,
        width: 384,
      }),
    );
    expect(out.get("rect")).toBe("55,78,1875,1875");
    expect(out.get("w")).toBe("384");
    expect(out.get("h")).toBe("480");
  });

  it("leaves a lone height alone rather than inventing a ratio", () => {
    // With no previous width there is no factor to scale by, and guessing one would
    // silently distort the image.
    const out = params(
      sanityImageLoader({ src: `${ASSET}?h=900`, width: 640 }),
    );
    expect(out.get("h")).toBe("900");
    expect(out.get("w")).toBe("640");
  });

  it("honours an explicit quality", () => {
    expect(
      params(sanityImageLoader({ src: ASSET, width: 640, quality: 90 })).get(
        "q",
      ),
    ).toBe("90");
  });

  it("passes non-Sanity sources straight through", () => {
    // Local and build-time assets have hashed names and nothing for Sanity to do.
    for (const src of [
      "/_next/static/media/logo.abc123.png",
      "/og-default.jpg",
      "data:image/svg+xml;base64,AAAA",
    ]) {
      expect(sanityImageLoader({ src, width: 640 })).toBe(src);
    }
  });

  it("never produces a zero or negative height", () => {
    // A tiny requested width against a very wide source rounds towards zero, and
    // Sanity rejects h=0 — which would be a broken image, the exact failure this
    // whole file is here to end.
    const out = params(
      sanityImageLoader({ src: `${ASSET}?w=2000&h=10`, width: 16 }),
    );
    expect(Number(out.get("h"))).toBeGreaterThan(0);
  });

  it("never throws, whatever it is handed", () => {
    // A loader runs inside render. An exception here is a blank page, not a blank
    // image, so the contract is "always returns a string" rather than any particular
    // string. Note `new URL` tolerates more than you would expect — a bare "%" parses
    // fine — so the try/catch is a backstop, not the main path.
    for (const src of [
      "https://cdn.sanity.io/%",
      "https://cdn.sanity.io/",
      "",
      "not a url at all",
    ]) {
      expect(() => sanityImageLoader({ src, width: 640 })).not.toThrow();
      expect(typeof sanityImageLoader({ src, width: 640 })).toBe("string");
    }
  });
});
