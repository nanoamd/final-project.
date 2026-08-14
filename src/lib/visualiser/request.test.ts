import { describe, expect, it } from "vitest";

import {
  buildEditForm,
  buildPrompt,
  isModelUnavailable,
  outputSize,
} from "./request";

const PRODUCTS = [
  {
    slug: "reclaimed-teak-dining-table-180cm",
    name: "Reclaimed Teak Dining Table 180cm | Kaiku",
  },
  { slug: "camden-round-side-table", name: "Camden Round Side Table | Kaiku" },
];

describe("buildPrompt", () => {
  const prompt = buildPrompt(PRODUCTS);

  it("numbers the products to match their position in the request", () => {
    // The scene is image 1, so products start at 2. If this drifts out of step with
    // the order buildEditForm appends them in, the model is told the wrong thing
    // about every product — and it would still return a plausible-looking picture,
    // which is the worst kind of bug.
    expect(prompt).toContain("Image 1 is a photograph of a real outdoor space");
    expect(prompt).toContain(
      "Image 2: Reclaimed Teak Dining Table 180cm | Kaiku",
    );
    expect(prompt).toContain("Image 3: Camden Round Side Table | Kaiku");
  });

  it("tells the model to reproduce rather than reinterpret", () => {
    expect(prompt).toMatch(/exactly as photographed/);
    expect(prompt).toMatch(/Do not substitute a similar item/);
  });

  it("asks for the existing furniture to be replaced, not added to", () => {
    // This reverses the original contract, which said "Add to the scene, do not
    // redecorate it". A visitor photographs the garden they already have, so a tool
    // that puts a chair next to their chair has answered a question nobody asked.
    expect(prompt).toMatch(/Take out the furniture that is already there/);
    expect(prompt).toMatch(/removed and replaced, not kept alongside/);
    expect(prompt).not.toMatch(/do not redecorate/i);
  });

  it("still protects the architecture and the camera", () => {
    // The line between staging a space and rebuilding somebody's house. An edit model
    // will resurface a patio and move a wall if it is allowed to.
    expect(prompt).toMatch(
      /Keep the architecture and the planting exactly as they are/,
    );
    expect(prompt).toMatch(
      /decking, paving, steps, boundary fences and hedges/,
    );
    expect(prompt).toMatch(
      /camera position, framing and perspective identical/,
    );
  });

  it("asks for a designed result rather than objects in a row", () => {
    expect(prompt).toMatch(/a clear focal point/);
    expect(prompt).toMatch(/Not a row, and not a showroom/);
  });

  it("forbids text in the image", () => {
    expect(prompt).toMatch(/No text, labels, signage, watermarks/);
  });
});

describe("outputSize", () => {
  it("matches a landscape photo", () => {
    expect(outputSize(4032, 3024)).toBe("1536x1024"); // 4:3 phone photo
    expect(outputSize(1920, 1080)).toBe("1536x1024"); // 16:9
  });

  it("matches a portrait photo", () => {
    expect(outputSize(3024, 4032)).toBe("1024x1536");
    expect(outputSize(1080, 1920)).toBe("1024x1536");
  });

  it("keeps a square photo square", () => {
    expect(outputSize(1024, 1024)).toBe("1024x1024");
    // Near-square stays square rather than being nudged into a crop.
    expect(outputSize(1100, 1000)).toBe("1024x1024");
  });

  it("falls back to square when the dimensions are unknown", () => {
    // sharp failing to read a file must not produce "0x0".
    expect(outputSize(0, 0)).toBe("1024x1024");
    expect(outputSize(1024, 0)).toBe("1024x1024");
  });
});

describe("buildEditForm", () => {
  const form = buildEditForm({
    model: "gpt-image-2",
    scene: Buffer.from([1, 2, 3]),
    sceneType: "image/jpeg",
    references: [
      {
        slug: "a",
        blob: new Blob([new Uint8Array([4])], { type: "image/png" }),
      },
      {
        slug: "b",
        blob: new Blob([new Uint8Array([5])], { type: "image/png" }),
      },
    ],
    prompt: "test prompt",
    size: "1536x1024",
  });

  it("sends the scene and every reference under image[]", () => {
    // The whole fix lives in this assertion. The old request appended a single
    // `image` field, so the products were words in a prompt and nothing more.
    const images = form.getAll("image[]");
    expect(images).toHaveLength(3);
  });

  it("puts the scene first, because the prompt calls it image 1", () => {
    const images = form.getAll("image[]") as File[];
    expect(images[0]?.name).toBe("scene");
    expect(images[1]?.name).toBe("a.png");
    expect(images[2]?.name).toBe("b.png");
  });

  it("carries the model, prompt, size and quality", () => {
    expect(form.get("model")).toBe("gpt-image-2");
    expect(form.get("prompt")).toBe("test prompt");
    expect(form.get("size")).toBe("1536x1024");
    expect(form.get("quality")).toBe("medium");
  });

  it("works with no references at all", () => {
    // Every product image failing to fetch is degraded, not broken.
    const bare = buildEditForm({
      model: "gpt-image-2",
      scene: Buffer.from([1]),
      sceneType: "image/png",
      references: [],
      prompt: "p",
      size: "1024x1024",
    });
    expect(bare.getAll("image[]")).toHaveLength(1);
  });
});

describe("isModelUnavailable", () => {
  it("recognises a model the account cannot reach", () => {
    expect(
      isModelUnavailable(
        400,
        '{"error":{"message":"The model `gpt-image-2` does not exist or you do not have access to it."}}',
      ),
    ).toBe(true);
    expect(isModelUnavailable(404, "model_not_found")).toBe(true);
  });

  it("does not retry a real failure", () => {
    // Retrying a rate limit or a content rejection just doubles the bill.
    expect(isModelUnavailable(429, "Rate limit reached")).toBe(false);
    expect(isModelUnavailable(500, "internal server error")).toBe(false);
    expect(
      isModelUnavailable(400, '{"error":{"message":"Invalid image format"}}'),
    ).toBe(false);
  });
});
