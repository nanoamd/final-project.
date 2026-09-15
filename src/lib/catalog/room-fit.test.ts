import { describe, expect, it } from "vitest";

import { fitsRoom, type ProductDimensions, type Room } from "./room-fit";

const livingRoom: Room = {
  name: "Living room",
  widthM: 4.2,
  lengthM: 3.6,
  heightM: 2.4,
};
const sofa: ProductDimensions = {
  width: 210,
  length: 90,
  height: 85,
  unit: "cm",
};

describe("fitsRoom", () => {
  it("gives a plain answer, not a measurement dump", () => {
    const result = fitsRoom(sofa, livingRoom);
    expect(result.verdict).toBe("fits");
    expect(result.message).toContain("Living room");
    expect(result.message).toContain("to walk past");
  });

  it("calls a cramped walkway tight rather than fine", () => {
    // 360cm short wall minus a 295cm deep piece leaves 65cm — passable, not comfortable.
    const result = fitsRoom(
      { width: 200, length: 295, height: 80, unit: "cm" },
      livingRoom,
    );
    expect(result.verdict).toBe("tight");
  });

  it("refuses a piece that leaves no room to walk", () => {
    const result = fitsRoom(
      { width: 200, length: 320, height: 80, unit: "cm" },
      livingRoom,
    );
    expect(result.verdict).toBe("too-big");
  });

  it("says how much too wide, not just no", () => {
    const result = fitsRoom(
      { width: 460, length: 60, height: 80, unit: "cm" },
      livingRoom,
    );
    expect(result.verdict).toBe("too-big");
    expect(result.message).toContain("40cm");
  });

  it("checks an alcove before the room, because it is the tighter constraint", () => {
    const room: Room = { ...livingRoom, alcoveWidthCm: 100 };
    const result = fitsRoom(
      { width: 115, length: 40, height: 80, unit: "cm" },
      room,
    );
    expect(result.verdict).toBe("too-big");
    expect(result.message).toContain("alcove");
    expect(result.message).toContain("15cm");
  });

  it("catches a piece taller than the ceiling", () => {
    const result = fitsRoom(
      { width: 80, length: 40, height: 250, unit: "cm" },
      livingRoom,
    );
    expect(result.verdict).toBe("too-big");
    expect(result.message).toContain("ceiling");
  });

  it("converts millimetres and metres rather than assuming centimetres", () => {
    const inMm = fitsRoom(
      { width: 2100, length: 900, height: 850, unit: "mm" },
      livingRoom,
    );
    const inCm = fitsRoom(sofa, livingRoom);
    expect(inMm.verdict).toBe(inCm.verdict);
    const inM = fitsRoom(
      { width: 2.1, length: 0.9, height: 0.85, unit: "m" },
      livingRoom,
    );
    expect(inM.verdict).toBe(inCm.verdict);
  });

  it("refuses to guess when the unit is unrecognised", () => {
    // A silent unit mismatch would produce a confident wrong answer, which is
    // the one outcome this feature cannot afford.
    const result = fitsRoom(
      { width: 210, length: 90, height: 85, unit: "inches" },
      livingRoom,
    );
    expect(result.verdict).toBe("unknown");
  });

  it("says it does not know rather than guessing", () => {
    expect(fitsRoom(null, livingRoom).verdict).toBe("unknown");
    expect(fitsRoom(sofa, null).verdict).toBe("unknown");
    expect(fitsRoom({ unit: "cm" }, livingRoom).verdict).toBe("unknown");
  });

  it("still answers on ceiling height alone when the floor plan is missing", () => {
    const partial: Room = { name: "Hallway", heightM: 2.3 };
    expect(
      fitsRoom({ width: 60, length: 30, height: 180, unit: "cm" }, partial)
        .verdict,
    ).toBe("fits");
    expect(
      fitsRoom({ width: 60, length: 30, height: 240, unit: "cm" }, partial)
        .verdict,
    ).toBe("too-big");
  });
});

describe("when fit is not a real question", () => {
  it("says nothing at all about small things", () => {
    // Running this across the catalogue returned "fits" on 877 of 907 products,
    // which buries the eleven answers worth reading.
    const candleHolder = { width: 14, length: 14, height: 33, unit: "cm" };
    const result = fitsRoom(candleHolder, livingRoom);
    expect(result.verdict).toBe("not-applicable");
    expect(result.message).toBe("");
  });

  it("still speaks about anything big enough to worry about", () => {
    const wardrobe = { width: 100, length: 60, height: 200, unit: "cm" };
    expect(fitsRoom(wardrobe, livingRoom).verdict).not.toBe("not-applicable");
  });
});
