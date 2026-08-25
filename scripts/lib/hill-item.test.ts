import { describe, expect, it } from "vitest";

import { parseItemPage } from "./hill-item";

const page = (code: string, name: string, extraImgs = "") => `
<html><body>
<h1>${name}</h1>
<img src="https://www.hill-interiors.com/images/small/${code}sml.jpg">
<img src="https://www.hill-interiors.com/images/giant/${code}.jpg">
<img src="https://www.hill-interiors.com/images/giant/${code}-a.jpg">
${extraImgs}
<p>Code:</p>
<p>${code}</p>
<p>Dimensions:</p>
<p>27L x 80W x 179H</p>
<h1>${name}</h1>
<p>Customers Also Bought</p>
<img src="https://www.hill-interiors.com/images/small/99999-asml.jpg">
</body></html>`;

describe("parseItemPage", () => {
  it("reads the title from the first h1", () => {
    expect(parseItemPage(page("24398", "Alto Shelf Unit"))?.title).toBe(
      "Alto Shelf Unit",
    );
  });

  it("reads the code from the line after 'Code:'", () => {
    expect(parseItemPage(page("24398", "Alto Shelf Unit"))?.code).toBe("24398");
  });

  it("collects only this item's own full-size photographs", () => {
    const result = parseItemPage(page("24398", "Alto Shelf Unit"));
    expect(result?.images).toEqual([
      "https://www.hill-interiors.com/images/giant/24398.jpg",
      "https://www.hill-interiors.com/images/giant/24398-a.jpg",
    ]);
  });

  it("excludes 'Customers Also Bought' thumbnails for other items", () => {
    const result = parseItemPage(page("24398", "Alto Shelf Unit"));
    expect(result?.images.some((url) => url.includes("99999"))).toBe(false);
  });

  it("deduplicates a photo that appears more than once on the page", () => {
    const withDupe = page(
      "24398",
      "Alto Shelf Unit",
      '<img src="https://www.hill-interiors.com/images/giant/24398-a.jpg">',
    );
    const result = parseItemPage(withDupe);
    expect(
      result?.images.filter((url) => url.endsWith("24398-a.jpg")),
    ).toHaveLength(1);
  });

  it("returns null when there is no item code on the page", () => {
    expect(parseItemPage("<html><h1>Something</h1></html>")).toBeNull();
  });

  it("returns null when there is no title on the page", () => {
    expect(parseItemPage("<html><p>Code:</p><p>123</p></html>")).toBeNull();
  });
});
