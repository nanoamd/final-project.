import { describe, expect, it } from "vitest";

import { parseProductPage } from "./premier-housewares";

const page = (sku: string, name: string, materials: string) => `
<html><body>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{"@type":"ListItem","position":1,"item":{"@id":"https://www.premierhousewares.com/","name":"Home"}},
{"@type":"ListItem","position":2,"item":{"@id":"https://www.premierhousewares.com/furniture/","name":"Furniture"}},
{"@type":"ListItem","position":3,"item":{"@id":"https://www.premierhousewares.com/conservatory-and-outdoor/","name":"Conservatory and Outdoor"}}
]}
</script>
<h1 class="productView-title">${name}</h1>
<img src="https://cdn11.bigcommerce.com/s-9eixvcjw2b/images/stencil/1280x1280/products/3338/112200/${sku}_01__58597.1754502052.jpg">
<img src="https://cdn11.bigcommerce.com/s-9eixvcjw2b/images/stencil/1280x1280/products/3338/112201/${sku}_02__44440.1754502052.jpg">
<img src="https://cdn11.bigcommerce.com/s-9eixvcjw2b/images/stencil/500x659/products/9999/999999/9999999__11111.1754502052.jpg">
<ul class="productView-info">
  <li><span class="label">SKU</span><span>${sku}</span></li>
  <li><span class="label">Range </span><span>Miami</span></li>
  <li><span class="label">Barcode</span><span>5018705974385</span></li>
  <li>
    <span class="label">Product Dimensions </span
    ><span class="Dimensions-num">w72.000000 x d77.000000 x h85.000000</span>
  </li>
  <li><span class="label">Materials </span><span>${materials}</span></li>
  <li><span class="label">Colour </span><span>Cream</span></li>
</ul>
</body></html>`;

describe("parseProductPage", () => {
  it("reads the title from productView-title", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))?.title,
    ).toBe("Miami Patio Set");
  });

  it("reads the SKU from the spec list", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))?.sku,
    ).toBe("2407024");
  });

  it("reads the barcode, digits only", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))
        ?.barcode,
    ).toBe("5018705974385");
  });

  it("reads the colour", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))?.colour,
    ).toBe("Cream");
  });

  it("collects only this item's own full-size photographs, capped and deduplicated", () => {
    const result = parseProductPage(
      page("2407024", "Miami Patio Set", "Steel 70%"),
    );
    expect(result?.images).toEqual([
      "https://www.premierhousewares.com/images/stencil/1280x1280/products/3338/112200/2407024_01__58597.1754502052.jpg",
      "https://www.premierhousewares.com/images/stencil/1280x1280/products/3338/112201/2407024_02__44440.1754502052.jpg",
    ]);
  });

  it("excludes another product's 500x659 thumbnail even though it appears on the page", () => {
    const result = parseProductPage(
      page("2407024", "Miami Patio Set", "Steel 70%"),
    );
    expect(result?.images.some((url) => url.includes("9999999"))).toBe(false);
  });

  it("reads dimensions across the newline BigCommerce's template puts between the label and value spans", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))
        ?.dimensions,
    ).toEqual({ width: 72, length: 77, height: 85 });
  });

  it("strips percentages and lowercases each material name, ready for mapMaterials", () => {
    expect(
      parseProductPage(
        page("2407024", "Miami Patio Set", "PE Rattan 19%,Steel 70%,Other 2%"),
      )?.materials,
    ).toEqual(["pe rattan", "steel", "other"]);
  });

  it("corrects the supplier's 'inoragnic' typo before it reaches the shared vocabulary", () => {
    expect(
      parseProductPage(
        page("2407024", "Face Planter", "inoragnic resin 30%, magnesia 45%"),
      )?.materials,
    ).toEqual(["inorganic resin", "magnesia"]);
  });

  it("reads the breadcrumb trail from the page's own BreadcrumbList JSON-LD", () => {
    expect(
      parseProductPage(page("2407024", "Miami Patio Set", "Steel 70%"))
        ?.categoryPath,
    ).toEqual(["Home", "Furniture", "Conservatory and Outdoor"]);
  });

  it("returns an empty breadcrumb trail when the page has no BreadcrumbList", () => {
    expect(
      parseProductPage(
        '<html><h1 class="productView-title">X</h1><li><span class="label">SKU</span><span>1</span></li></html>',
      )?.categoryPath,
    ).toEqual([]);
  });

  it("returns null when the page has no SKU", () => {
    expect(
      parseProductPage("<html><h1 class='productView-title'>X</h1></html>"),
    ).toBeNull();
  });

  it("returns null when the page has no title", () => {
    expect(
      parseProductPage(
        '<html><li><span class="label">SKU</span><span>123</span></li></html>',
      ),
    ).toBeNull();
  });
});
