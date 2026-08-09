import { describe, expect, it } from "vitest";

import { alignReturnsWindow } from "./align-returns-window";

describe("alignReturnsWindow", () => {
  it("rewrites a longer window down to the policy", () => {
    const { text, from } = alignReturnsWindow(
      "If you change your mind, you can return this product within 30 days of delivery, provided it is unused.",
    );
    expect(text).toContain("within 14 days of delivery");
    expect(from).toEqual([30]);
  });

  it("leaves a paragraph that already states the policy untouched", () => {
    const notes =
      "You may return your order within 14 days of delivery in accordance with our Returns Policy.";
    const { text, from } = alignReturnsWindow(notes);
    expect(text).toBe(notes);
    expect(from).toEqual([]);
  });

  it("does not touch a delivery lead time", () => {
    // The real failure mode: these paragraphs carry both a lead time and a
    // returns window, and "7-10 working days" is not a returns promise.
    const notes =
      "Delivery typically takes 7-10 working days where stock is available. " +
      "If you change your mind, you can return this product within 30 days of delivery.";
    const { text } = alignReturnsWindow(notes);
    expect(text).toContain("7-10 working days");
    expect(text).toContain("within 14 days of delivery");
  });

  it("does not touch a bare day count with no delivery or receipt anchor", () => {
    const notes = "Made-to-order items are built within 21 days of ordering.";
    expect(alignReturnsWindow(notes).text).toBe(notes);
  });

  it("handles 'of receipt' as well as 'of delivery', keeping the wording", () => {
    const { text } = alignReturnsWindow(
      "Returns accepted within 28 calendar days of receipt.",
    );
    expect(text).toBe("Returns accepted within 14 days of receipt.");
  });

  it("rewrites every window in a paragraph that states more than one", () => {
    const { text, from } = alignReturnsWindow(
      "Return within 30 days of delivery. Faulty goods: within 60 days of receipt.",
    );
    expect(from).toEqual([30, 60]);
    expect(text).toBe(
      "Return within 14 days of delivery. Faulty goods: within 14 days of receipt.",
    );
  });

  it("honours a different policy length when one is passed", () => {
    const { text } = alignReturnsWindow(
      "Return within 14 days of delivery.",
      30,
    );
    expect(text).toBe("Return within 30 days of delivery.");
  });
});
