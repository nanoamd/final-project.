import { describe, expect, it } from "vitest";

import type { AbandonedLineItem } from "@/lib/commerce/abandoned-checkout";

import {
  type AbandonedCheckoutData,
  buildAbandonedCheckoutEmail,
  summariseBasket,
} from "./abandoned-checkout";

const SITE = "https://kaikuhome.com";

function item(overrides: Partial<AbandonedLineItem> = {}): AbandonedLineItem {
  return {
    slug: "sorelle-3-seater-sofa",
    category: "sofas",
    name: "Sorelle 3 Seater Sofa",
    quantity: 1,
    unit_amount: 129900,
    image: null,
    ...overrides,
  };
}

function data(overrides: Partial<AbandonedCheckoutData> = {}) {
  return {
    customerName: "Alex Hartley",
    items: [item()],
    amountTotal: 129900,
    siteUrl: SITE,
    ...overrides,
  };
}

describe("the abandoned basket email", () => {
  it("names the piece and shows the price the customer saw", () => {
    const built = buildAbandonedCheckoutEmail(data());
    expect(built.html).toContain("Sorelle 3 Seater Sofa");
    expect(built.html).toContain("£1299.00");
    expect(built.text).toContain("Sorelle 3 Seater Sofa");
  });

  it("greets by first name only, and copes without one", () => {
    expect(buildAbandonedCheckoutEmail(data()).html).toContain("Alex");
    expect(buildAbandonedCheckoutEmail(data()).html).not.toContain("Hartley");

    const anonymous = buildAbandonedCheckoutEmail(
      data({ customerName: null }),
    ).html;
    expect(anonymous).toContain("You left something with us.");
  });

  it("links a single piece to its own page, category and all", () => {
    // The route is /shop/[category]/[product]. A slug on its own is a 404 in
    // the one email whose entire job is getting somebody back to the piece.
    const built = buildAbandonedCheckoutEmail(data());
    expect(built.html).toContain(
      "https://kaikuhome.com/shop/sofas/sorelle-3-seater-sofa",
    );
    expect(built.text).toContain(
      "https://kaikuhome.com/shop/sofas/sorelle-3-seater-sofa",
    );
  });

  it("sends a multi-item basket to the basket, not to one of the items", () => {
    const built = buildAbandonedCheckoutEmail(
      data({
        items: [
          item(),
          item({
            slug: "arden-oak-coffee-table",
            category: "coffee-tables",
            name: "Arden Oak Coffee Table",
            unit_amount: 32500,
          }),
        ],
        amountTotal: 162400,
      }),
    );
    expect(built.text).toContain(
      "Return to your basket: https://kaikuhome.com/cart",
    );
    expect(built.html).toContain("Arden Oak Coffee Table");
    expect(built.html).toContain("Sorelle 3 Seater Sofa");
  });

  it("falls back to the basket when the category never came through", () => {
    // Stripe metadata is best-effort: an old session may carry a slug and no
    // category. A half-built URL would 404, so it is not built at all.
    const built = buildAbandonedCheckoutEmail(
      data({ items: [item({ category: null })] }),
    );
    expect(built.html).not.toContain("/shop/null/");
    expect(built.html).toContain("https://kaikuhome.com/cart");
  });

  it("still sends something useful when Stripe gave us no line items", () => {
    const built = buildAbandonedCheckoutEmail(
      data({ items: [], amountTotal: null }),
    );
    expect(built.html).toContain("You left something with us");
    expect(built.html).toContain("https://kaikuhome.com/cart");
    expect(built.html).not.toContain("What was in it");
  });

  it("shows the quantity only when there is more than one", () => {
    expect(buildAbandonedCheckoutEmail(data()).html).not.toContain("Quantity");
    const pair = buildAbandonedCheckoutEmail(
      data({ items: [item({ quantity: 2 })] }),
    );
    expect(pair.html).toContain("Quantity 2");
  });

  it("escapes a product name rather than letting it break the markup", () => {
    const built = buildAbandonedCheckoutEmail(
      data({ items: [item({ name: 'Sofa <script>alert("x")</script>' })] }),
    );
    expect(built.html).not.toContain("<script>");
    expect(built.html).toContain("&lt;script&gt;");
  });

  it("carries no discount and promises no follow-up", () => {
    // Both are deliberate. A discount teaches customers to abandon a basket
    // first, and a single email with no sequence behind it is why this needs
    // no unsubscribe link to be defensible.
    const built = buildAbandonedCheckoutEmail(data());
    expect(built.html.toLowerCase()).not.toMatch(/% off|discount|code/);
    expect(built.html).toContain("the only email we will send");
    expect(built.text).toContain("the only email we will send");
  });

  it("shows the product photo when there is exactly one piece", () => {
    const withImage = buildAbandonedCheckoutEmail(
      data({
        items: [item({ image: "https://cdn.sanity.io/images/sofa.jpg" })],
      }),
    );
    expect(withImage.html).toContain("https://cdn.sanity.io/images/sofa.jpg");
  });

  it("always has a plain-text part", () => {
    // A message with no text part scores measurably worse on delivery, and
    // this one has to reach an inbox to be worth anything at all.
    const built = buildAbandonedCheckoutEmail(data());
    expect(built.text.trim().length).toBeGreaterThan(200);
    expect(built.subject).toBe("Your Kaiku basket is still here");
  });
});

describe("summariseBasket", () => {
  it("describes one, two, and many", () => {
    expect(summariseBasket([item()])).toBe("Sorelle 3 Seater Sofa");
    expect(summariseBasket([item(), item({ name: "Arden Table" })])).toBe(
      "Sorelle 3 Seater Sofa and Arden Table",
    );
    expect(
      summariseBasket([
        item(),
        item({ name: "Arden Table" }),
        item({ name: "Brass Lamp" }),
      ]),
    ).toBe("Sorelle 3 Seater Sofa and 2 other pieces");
  });

  it("falls back rather than naming nothing", () => {
    expect(summariseBasket([])).toBe("your basket");
    expect(summariseBasket([item({ name: null, slug: null })])).toBe(
      "your basket",
    );
  });

  it("uses the slug when the name is missing", () => {
    expect(summariseBasket([item({ name: null })])).toBe(
      "sorelle-3-seater-sofa",
    );
  });
});
