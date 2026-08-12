import { describe, expect, it } from "vitest";

import { altProductName, buildGalleryAlts } from "./image-alt";

describe("altProductName", () => {
  it("keeps the product's name and drops the keyword tail", () => {
    expect(
      altProductName(
        "Abberley White End Table | Luxury Oak Side Table | Kaiku",
      ),
    ).toBe("Abberley White End Table");
  });

  it("drops a bare Kaiku suffix", () => {
    expect(altProductName("Witley Coffee Table | Kaiku")).toBe(
      "Witley Coffee Table",
    );
  });

  it("leaves a plain name alone", () => {
    expect(altProductName("Bedside Table - Classic - Recycled Wood")).toBe(
      "Bedside Table - Classic - Recycled Wood",
    );
  });
});

describe("buildGalleryAlts", () => {
  const CATALOGUE = { isStudioShot: true };
  const SETTING = { isStudioShot: false };

  it("gives the lead photo the plain product name", () => {
    expect(
      buildGalleryAlts("Witley Coffee Table | Kaiku", "Living Room", [
        CATALOGUE,
      ]),
    ).toEqual(["Witley Coffee Table"]);
  });

  it("numbers further product views from second, not first", () => {
    expect(
      buildGalleryAlts("Witley Coffee Table | Kaiku", "Living Room", [
        CATALOGUE,
        CATALOGUE,
        CATALOGUE,
      ]),
    ).toEqual([
      "Witley Coffee Table",
      "Witley Coffee Table, second product view",
      "Witley Coffee Table, third product view",
    ]);
  });

  it("names the room for a setting photograph, from the department", () => {
    expect(
      buildGalleryAlts("Witley Coffee Table | Kaiku", "Living Room", [
        CATALOGUE,
        SETTING,
      ])[1],
    ).toBe("Witley Coffee Table photographed in a living room");
  });

  it("says garden for outdoor departments", () => {
    expect(
      buildGalleryAlts("Solar Garden Lamp Post", "Outdoor Living", [
        CATALOGUE,
        SETTING,
      ])[1],
    ).toBe("Solar Garden Lamp Post photographed in a garden");
  });

  it("stays neutral when the department does not imply a room", () => {
    // Lighting is the case this exists for: a table lamp's department says
    // nothing about where it was photographed, and guessing "a living room"
    // would be a fabrication in an accessibility attribute.
    expect(
      buildGalleryAlts("Bamboo Gesso Table Lamp", "Lighting", [
        CATALOGUE,
        SETTING,
      ])[1],
    ).toBe("Bamboo Gesso Table Lamp photographed in a styled setting");
    expect(
      buildGalleryAlts("Bamboo Gesso Table Lamp", null, [
        CATALOGUE,
        SETTING,
      ])[1],
    ).toBe("Bamboo Gesso Table Lamp photographed in a styled setting");
  });

  it("distinguishes a second setting photograph from the first", () => {
    const alts = buildGalleryAlts(
      "Set of 3 Gamal Wood Plant Stands",
      "Garden",
      [CATALOGUE, SETTING, SETTING],
    );
    expect(alts[1]).toBe(
      "Set of 3 Gamal Wood Plant Stands photographed in a garden",
    );
    expect(alts[2]).toBe(
      "Set of 3 Gamal Wood Plant Stands photographed in a garden (2)",
    );
  });

  it("names the variant when the photo belongs to one", () => {
    expect(
      buildGalleryAlts("Hampton Console Table | Kaiku", "Living Room", [
        { isStudioShot: true, optionValue: "Ivory" },
      ])[0],
    ).toBe("Hampton Console Table in Ivory");
  });

  it("does not repeat a finish the product name already states", () => {
    // Half the furniture range is named for its finish, so the naive version
    // reads "Abberley White Bedside Table in White".
    expect(
      buildGalleryAlts("Abberley White Bedside Table | Kaiku", "Bedroom", [
        { isStudioShot: true, optionValue: "White" },
      ])[0],
    ).toBe("Abberley White Bedside Table");
  });

  it("still names a variant that contradicts the name — that is the useful case", () => {
    expect(
      buildGalleryAlts("Abberley White Chest of Drawers | Kaiku", "Bedroom", [
        { isStudioShot: true },
        { isStudioShot: true, optionValue: "Black" },
      ])[1],
    ).toBe("Abberley White Chest of Drawers in Black, second product view");
  });

  it("never overwrites alt text an editor already wrote", () => {
    expect(
      buildGalleryAlts("Witley Coffee Table | Kaiku", "Living Room", [
        { isStudioShot: true, alt: "Witley table beside a bay window" },
        CATALOGUE,
      ]),
    ).toEqual([null, "Witley Coffee Table, second product view"]);
  });

  it("treats whitespace-only alt text as missing", () => {
    expect(
      buildGalleryAlts("Witley Coffee Table | Kaiku", "Living Room", [
        { isStudioShot: true, alt: "   " },
      ]),
    ).toEqual(["Witley Coffee Table"]);
  });

  it("produces no duplicate text within a gallery", () => {
    // The brief asks for unique alt text. Six photos of one chest of drawers is
    // the case that would otherwise repeat.
    const alts = buildGalleryAlts(
      "Charlton Chest of Drawers | Kaiku",
      "Bedroom",
      [CATALOGUE, CATALOGUE, CATALOGUE, SETTING, SETTING, CATALOGUE],
    ).filter((alt): alt is string => alt !== null);
    expect(new Set(alts).size).toBe(alts.length);
  });

  it("says nothing rather than something wrong for an untitled product", () => {
    expect(buildGalleryAlts("", "Bedroom", [CATALOGUE])).toEqual([null]);
  });
});
