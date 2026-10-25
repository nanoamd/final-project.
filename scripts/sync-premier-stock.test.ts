import { describe, expect, it } from "vitest";

import {
  indexSitemapBySku,
  parseStock,
  statusFor,
  type StockAttributes,
} from "./sync-premier-stock";

/**
 * The real blob from `allure-chrome-wing-base-end-table-5502580`, which had 16
 * units when this was written. Kept verbatim because the keys that are NOT
 * stock signals are the point: `purchasable` is false here, on a product with
 * sixteen in stock, because trade pricing sits behind a login.
 */
const BC_DATA = `<script type="text/javascript">
var BCData = {"product_attributes":{"sku":"5502580","upc":null,"mpn":null,"gtin":null,"weight":null,"base":true,"image":null,"price":{"price_range":[],"retail_price_range":[]},"out_of_stock_behavior":"label_option","out_of_stock_message":"Out of stock","available_modifier_values":[],"in_stock_attributes":[],"stock":16,"instock":true,"available_to_sell":16,"available_on_hand":16,"available_for_backorder":0,"unlimited_backorder":false,"backorder_message_id":null,"stock_message":null,"purchasable":false,"purchasing_message":"","call_for_price_message":null,"disabled_option_values":[]}};
</script>`;

const attrs = (over: Partial<StockAttributes> = {}): StockAttributes => ({
  sku: "5502580",
  stock: 16,
  instock: true,
  availableToSell: 16,
  ...over,
});

describe("parseStock", () => {
  it("reads the live figures out of BCData", () => {
    expect(parseStock(BC_DATA)).toEqual({
      sku: "5502580",
      stock: 16,
      instock: true,
      availableToSell: 16,
    });
  });

  it("ignores the JSON-LD block, which contradicts the truth", () => {
    // The same page carries `"availability" : "https://schema.org/OutOfStock"`
    // for a product with 16 units. Reading it would take the line off sale.
    const page = `
      <meta property="og:availability" content="instock" />
      <script type="application/ld+json">
      {"offers":{"@type":"Offer","price":"","availability":"https://schema.org/OutOfStock"}}
      </script>
      ${BC_DATA}`;
    expect(statusFor(parseStock(page)!)).toBe("In Stock");
  });

  it("returns null when the page says nothing, so the caller leaves it alone", () => {
    expect(parseStock("<html><body>maintenance</body></html>")).toBeNull();
    expect(parseStock("var BCData = {not json};")).toBeNull();
  });

  it("returns null when BCData carries no SKU to match on", () => {
    expect(
      parseStock('var BCData = {"product_attributes":{"stock":4}};'),
    ).toBeNull();
  });
});

describe("statusFor", () => {
  it("is In Stock when the flag and the number agree", () => {
    expect(statusFor(attrs())).toBe("In Stock");
  });

  it("is Out of Stock at zero — the Mistora case, on Premier's catalogue", () => {
    expect(statusFor(attrs({ stock: 0, availableToSell: 0 }))).toBe(
      "Out of Stock",
    );
  });

  it("needs both signals, not either", () => {
    // A flag without a number, and a number without a flag, are both untrusted.
    expect(statusFor(attrs({ instock: true, availableToSell: 0 }))).toBe(
      "Out of Stock",
    );
    expect(statusFor(attrs({ instock: false, availableToSell: 16 }))).toBe(
      "Out of Stock",
    );
  });

  it("never invents Backorder — the page carries no restock date", () => {
    for (const a of [attrs(), attrs({ instock: false, availableToSell: 0 })])
      expect(["In Stock", "Out of Stock"]).toContain(statusFor(a));
  });
});

describe("indexSitemapBySku", () => {
  it("keys product URLs by the SKU they end in", () => {
    const xml = `
      <url><loc>https://www.premierhousewares.com/allure-chrome-wing-base-end-table-5502580</loc></url>
      <url><loc>https://www.premierhousewares.com/welcome-multicolour-coir-doormat-1901560</loc></url>`;
    const map = indexSitemapBySku(xml);
    expect(map.get("5502580")).toBe(
      "https://www.premierhousewares.com/allure-chrome-wing-base-end-table-5502580",
    );
    expect(map.get("1901560")).toBe(
      "https://www.premierhousewares.com/welcome-multicolour-coir-doormat-1901560",
    );
  });

  it("skips category and content URLs that carry no SKU", () => {
    const xml = `
      <url><loc>https://www.premierhousewares.com/garden-furniture</loc></url>
      <url><loc>https://www.premierhousewares.com/about-us</loc></url>`;
    expect(indexSitemapBySku(xml).size).toBe(0);
  });
});
