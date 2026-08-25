import { describe, expect, it } from "vitest";

import {
  curateSet,
  isNativeOutdoor,
  outdoorPool,
  productRole,
  type SelectableProduct,
  suitsOutdoors,
} from "./selection";

/** The real outdoor-reachable catalogue at the time of writing, plus a sauna. */
const CATALOGUE: SelectableProduct[] = [
  {
    slug: "large-brown-wooden-storage-tub",
    name: "Large Brown Wooden Storage Tub | Kaiku",
    category: "rustic-reclaimed-furniture",
    price: 40,
    roomTags: ["Living room", "Garden"],
    departmentSlug: "living-room",
  },
  {
    slug: "tarn-large-pot-with-handles",
    name: "Tarn Large Pot with Handles | Kaiku",
    category: "planters",
    price: 43,
    departmentSlug: "outdoor-living",
  },
  {
    slug: "axis-putty-grey-carver-dining-chair",
    name: "Axis Putty Grey Carver Dining Chair | Kaiku",
    category: "garden-furniture",
    price: 56,
    departmentSlug: "outdoor-living",
  },
  {
    slug: "natural-folding-wooden-a-frame-shelf-brown",
    name: "Natural Folding Wooden A-Frame Shelf – Brown | Kaiku",
    category: "rustic-reclaimed-furniture",
    price: 121.35,
    roomTags: ["Living room", "Garden"],
    departmentSlug: "living-room",
  },
  {
    slug: "alto-putty-grey-outdoor-table",
    name: "Alto Putty Grey Outdoor Table | Kaiku",
    category: "garden-furniture",
    price: 135,
    departmentSlug: "outdoor-living",
  },
  {
    slug: "saunaplunge-pennine-barrel-6-person-outdoor-sauna",
    name: "SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna | Kaiku",
    category: "outdoor-saunas",
    price: 6379,
    departmentSlug: "sauna",
  },
  {
    slug: "saunaplunge-bronte-2-person-outdoor-cabin-sauna",
    name: "SaunaPlunge™ Bronte 2-Person Outdoor Cabin Sauna | Kaiku",
    category: "outdoor-saunas",
    price: 3189,
    departmentSlug: "sauna",
  },
  {
    slug: "abberley-white-chest-of-drawers",
    name: "Abberley White Chest of Drawers | Kaiku",
    category: "living-room-storage",
    price: 749,
    roomTags: ["Living room", "Bedroom"],
    departmentSlug: "living-room",
  },
];

const bySlug = (slug: string) => CATALOGUE.find((p) => p.slug === slug)!;

describe("productRole", () => {
  it("separates seating from tables inside one category", () => {
    // Both live in `garden-furniture`, so the category alone cannot tell them apart —
    // which is why the name is read too.
    expect(productRole(bySlug("axis-putty-grey-carver-dining-chair"))).toBe(
      "seating",
    );
    expect(productRole(bySlug("alto-putty-grey-outdoor-table"))).toBe("table");
  });

  it("treats a sauna as the hero", () => {
    expect(
      productRole(bySlug("saunaplunge-pennine-barrel-6-person-outdoor-sauna")),
    ).toBe("hero");
  });

  it("reads storage and planters", () => {
    expect(productRole(bySlug("large-brown-wooden-storage-tub"))).toBe(
      "storage",
    );
    expect(
      productRole(bySlug("natural-folding-wooden-a-frame-shelf-brown")),
    ).toBe("storage");
    expect(productRole(bySlug("tarn-large-pot-with-handles"))).toBe("planter");
  });
});

describe("suitsOutdoors", () => {
  it("keeps anything in an outdoor department", () => {
    expect(isNativeOutdoor(bySlug("alto-putty-grey-outdoor-table"))).toBe(true);
    expect(
      isNativeOutdoor(
        bySlug("saunaplunge-pennine-barrel-6-person-outdoor-sauna"),
      ),
    ).toBe(true);
  });

  it("allows a Garden-tagged cross-listing, but not as a native", () => {
    // The indoor A-frame shelf carries "Garden" in its room tags, which is how it
    // ended up on a decked terrace. It stays eligible as filler and loses to the
    // native outdoor pieces in ordering.
    const shelf = bySlug("natural-folding-wooden-a-frame-shelf-brown");
    expect(suitsOutdoors(shelf)).toBe(true);
    expect(isNativeOutdoor(shelf)).toBe(false);
  });

  it("excludes an indoor-only product", () => {
    expect(suitsOutdoors(bySlug("abberley-white-chest-of-drawers"))).toBe(
      false,
    );
  });
});

describe("outdoorPool", () => {
  const pool = outdoorPool(CATALOGUE);

  it("drops indoor-only products", () => {
    expect(pool.map((p) => p.slug)).not.toContain(
      "abberley-white-chest-of-drawers",
    );
  });

  it("puts native outdoor products ahead of cross-listings", () => {
    const shelfIndex = pool.findIndex(
      (p) => p.slug === "natural-folding-wooden-a-frame-shelf-brown",
    );
    const chairIndex = pool.findIndex(
      (p) => p.slug === "axis-putty-grey-carver-dining-chair",
    );
    expect(chairIndex).toBeLessThan(shelfIndex);
  });
});

describe("curateSet", () => {
  const set = curateSet(outdoorPool(CATALOGUE), { max: 3 });

  it("leads with the sauna", () => {
    // The commercial point of the tool, and previously impossible: choosing "Outdoor
    // Living" excluded every sauna because they sit under their own department.
    expect(set[0]?.slug).toBe(
      "saunaplunge-pennine-barrel-6-person-outdoor-sauna",
    );
  });

  it("fills distinct roles rather than picking three of anything", () => {
    const roles = set.map(productRole);
    expect(new Set(roles).size).toBe(roles.length);
    expect(roles).toContain("hero");
    expect(roles).toContain("seating");
    expect(roles).toContain("table");
  });

  it("does not lead with a storage crate", () => {
    // The render that prompted this had two barrels and a shelf in it.
    expect(productRole(set[0]!)).not.toBe("storage");
  });

  it("varies with rotate, without shuffling", () => {
    const a = curateSet(outdoorPool(CATALOGUE), { max: 3, rotate: 0 });
    const b = curateSet(outdoorPool(CATALOGUE), { max: 3, rotate: 1 });
    // Same roles in the same order — the composition is stable. What changes is which
    // candidate fills a role that has more than one, here the two saunas. Shuffling
    // the whole pool is what produced "it just dumps random products"; this gives
    // variety without giving up the composition.
    expect(a.map(productRole)).toEqual(b.map(productRole));
    expect(a[0]!.slug).not.toBe(b[0]!.slug);
    expect(productRole(a[0]!)).toBe("hero");
    expect(productRole(b[0]!)).toBe("hero");
  });

  it("tops up when there are fewer roles than slots", () => {
    const thin = curateSet(
      [
        bySlug("tarn-large-pot-with-handles"),
        bySlug("large-brown-wooden-storage-tub"),
      ],
      { max: 3 },
    );
    expect(thin).toHaveLength(2);
  });

  it("returns nothing for an empty pool rather than throwing", () => {
    expect(curateSet([], { max: 3 })).toEqual([]);
  });
});
