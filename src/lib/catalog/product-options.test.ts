import { describe, expect, it } from "vitest";

import {
  describeValues,
  descriptiveOptions,
  isColourOption,
  isSelectableOption,
  selectableOptions,
} from "./product-options";

const abberley = {
  option: { label: "Colour", values: ["White ", "Black", "Brown"] },
  gallery: [
    { optionValue: "White" },
    { optionValue: null },
    { optionValue: "Black" },
    { optionValue: "Brown" },
  ],
};

const neatham = {
  // Damien: "bronze brass etc aren't actual variants it's just the different
  // colours of one product". One table — black top, brass-gold legs.
  option: { label: "Colour", values: ["Black", "Brass", "Gold"] },
  gallery: [{ optionValue: null }, { optionValue: null }],
};

describe("isColourOption", () => {
  it("recognises the labels the catalogue uses for a colour", () => {
    for (const label of ["Colour", "colour", "Color", "Finish", "Shade"])
      expect(isColourOption({ label, values: [] })).toBe(true);
  });

  it("does not treat a dimension or a fitting as a colour", () => {
    for (const label of ["Size", "Power", "Length", "Fitting"])
      expect(isColourOption({ label, values: [] })).toBe(false);
  });
});

describe("isSelectableOption", () => {
  it("is a choice when the gallery photographs more than one value", () => {
    expect(isSelectableOption(abberley.option, abberley.gallery)).toBe(true);
  });

  it("is a description when nothing distinguishes the values", () => {
    expect(isSelectableOption(neatham.option, neatham.gallery)).toBe(false);
  });

  it("is a description when only one value is photographed", () => {
    // A single photographed value proves nothing about the others: the beer
    // barrel stool offers Natural and Whitewash with only the whitewash shot.
    expect(
      isSelectableOption(
        { label: "Colour", values: ["Natural", "Whitewash"] },
        [{ optionValue: "Whitewash" }, { optionValue: null }],
      ),
    ).toBe(false);
  });

  it("ignores the catalogue's trailing spaces and casing", () => {
    // Option values carry trailing spaces ("White ", "Ivory ") and inconsistent
    // case. Matching exactly would classify a properly photographed variant as a
    // description and silently remove a real choice.
    expect(
      isSelectableOption(
        { label: "Colour", values: ["Ivory Shagreen ", "Grey Shagreen "] },
        [{ optionValue: "ivory shagreen" }, { optionValue: "Grey Shagreen" }],
      ),
    ).toBe(true);
  });

  it("does not count a photograph tagged with something the option never offers", () => {
    expect(
      isSelectableOption({ label: "Colour", values: ["Black", "Grey"] }, [
        { optionValue: "Oak" },
        { optionValue: "Walnut" },
      ]),
    ).toBe(false);
  });

  it("treats a non-colour option as a choice whatever the photographs show", () => {
    expect(
      isSelectableOption({ label: "Size", values: ["60cm", "80cm"] }, [
        { optionValue: null },
      ]),
    ).toBe(true);
  });
});

describe("selectableOptions and descriptiveOptions", () => {
  const options = [
    neatham.option,
    { label: "Size", values: ["Small", "Large"] },
    abberley.option,
  ];
  const gallery = [...abberley.gallery];

  it("splits the options with nothing lost from either side", () => {
    const chosen = selectableOptions(options, gallery);
    const described = descriptiveOptions(options, gallery);
    expect(chosen.map((o) => o.label)).toEqual(["Size", "Colour"]);
    expect(described).toEqual([neatham.option]);
    expect(chosen.length + described.length).toBe(options.length);
  });

  it("handles a product with no options at all", () => {
    expect(selectableOptions(null, [])).toEqual([]);
    expect(descriptiveOptions(undefined, [])).toEqual([]);
  });
});

describe("describeValues", () => {
  it("reads as a sentence", () => {
    expect(describeValues(["Black", "Brass", "Gold"])).toBe(
      "Black, Brass and Gold",
    );
    expect(describeValues(["Grey", "Oak"])).toBe("Grey and Oak");
    expect(describeValues(["Ivory "])).toBe("Ivory");
    expect(describeValues([])).toBe("");
  });
});
