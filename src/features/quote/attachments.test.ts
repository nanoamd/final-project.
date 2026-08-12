import { describe, expect, it } from "vitest";

import {
  formatBytes,
  isAcceptedAttachment,
  MAX_ATTACHMENT_TOTAL_BYTES,
  validateAttachments,
} from "@/features/quote/attachments";

const MB = 1024 * 1024;

describe("validateAttachments", () => {
  it("accepts an empty set", () => {
    expect(validateAttachments([])).toBeNull();
  });

  it("accepts photos and plans within the limits", () => {
    expect(
      validateAttachments([
        { name: "garden.jpg", size: 1.2 * MB },
        { name: "plans.PDF", size: 0.4 * MB },
        { name: "photo.HEIC", size: 1 * MB },
      ]),
    ).toBeNull();
  });

  it("rejects more than three files", () => {
    const error = validateAttachments([
      { name: "a.jpg", size: 1 },
      { name: "b.jpg", size: 1 },
      { name: "c.jpg", size: 1 },
      { name: "d.jpg", size: 1 },
    ]);
    expect(error).toMatch(/up to 3 files/);
  });

  it("names the file it cannot accept", () => {
    expect(validateAttachments([{ name: "sketch.dwg", size: 1 }])).toMatch(
      /sketch\.dwg/,
    );
  });

  it("rejects a set over the total size limit", () => {
    const error = validateAttachments([
      { name: "a.jpg", size: MAX_ATTACHMENT_TOTAL_BYTES },
      { name: "b.jpg", size: 1 },
    ]);
    expect(error).toMatch(/in total/);
  });

  it("treats a file with no extension as unacceptable", () => {
    expect(isAcceptedAttachment({ name: "screenshot", size: 1 })).toBe(false);
  });
});

describe("formatBytes", () => {
  it("scales the unit to the size", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * MB)).toBe("1.5 MB");
    expect(formatBytes(12 * MB)).toBe("12 MB");
  });
});
