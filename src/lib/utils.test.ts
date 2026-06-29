import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("lets later Tailwind utilities win over earlier conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsey values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
