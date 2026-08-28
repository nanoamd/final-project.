/**
 * Pendant and ceiling light sizing: how big, and how low to hang it.
 *
 * Three conventions that lighting designers use, and that people search for
 * directly:
 *
 *   - Diameter. Add the room's dimensions in feet and read the answer in
 *     inches. A 12ft x 14ft room wants a fixture around 26in across. It is an
 *     odd-looking rule and it works; converted to metric it is roughly
 *     (width + length in metres) x 10 = diameter in cm.
 *   - Over a dining table, ignore the room and use the table: a pendant wants
 *     to be between half and two-thirds of the table's width.
 *   - Height. Over a table, the bottom of the shade sits 75-90cm above the
 *     tabletop. In open floor space, leave at least 210cm of headroom beneath
 *     it, and add 7.5cm of drop for every foot of ceiling above 8ft.
 *
 * Pure arithmetic over the shopper's own measurements.
 */

/** Headroom under a pendant in a walkway, in cm. Below this people duck. */
export const MIN_HEADROOM_CM = 210;
/** The gap from tabletop to the bottom of the shade, in cm. */
export const OVER_TABLE_GAP_CM = { min: 75, max: 90 };
/** A standard ceiling, in cm — the baseline the drop rule adds to. */
export const BASE_CEILING_CM = 244;

export interface PendantInput {
  /** Room width in cm. */
  roomWidth?: number;
  /** Room length in cm. */
  roomLength?: number;
  /** Ceiling height in cm. */
  ceilingHeight?: number;
  /** Table width in cm, when the light hangs over a table. */
  tableWidth?: number;
}

export interface PendantResult {
  /** Fixture diameter to aim for, in cm. */
  diameter: { min: number; max: number; ideal: number };
  /** Where the bottom of the shade should sit above the floor, in cm. */
  bottomAboveFloor?: number;
  /** Where it should sit above the tabletop, in cm, when over a table. */
  aboveTable?: { min: number; max: number };
  /** Which rule produced the diameter, so the page can say. */
  basis: "table" | "room";
  notes: string[];
}

const round = (n: number) => Math.round(n);

export function pendantSize(input: PendantInput): PendantResult | null {
  const { roomWidth, roomLength, ceilingHeight, tableWidth } = input;
  const notes: string[] = [];

  let diameter: PendantResult["diameter"];
  let basis: PendantResult["basis"];

  if (tableWidth && tableWidth > 0) {
    // Over a table the table decides, not the room.
    diameter = {
      min: round(tableWidth * 0.5),
      max: round(tableWidth * 0.66),
      ideal: round(tableWidth * 0.58),
    };
    basis = "table";
    notes.push(
      "Over a table, the table sets the size rather than the room — a pendant between a half and two-thirds of the table's width reads as belonging to it.",
    );
  } else if (roomWidth && roomWidth > 0 && roomLength && roomLength > 0) {
    // (width + length in metres) x 10, in cm.
    const ideal = round(((roomWidth + roomLength) / 100) * 10);
    diameter = { min: round(ideal * 0.85), max: round(ideal * 1.15), ideal };
    basis = "room";
    notes.push(
      "In open floor space the room sets the size: add the width and length in metres, and that number in tens of centimetres is the diameter to aim for.",
    );
  } else {
    return null;
  }

  let bottomAboveFloor: number | undefined;
  let aboveTable: PendantResult["aboveTable"];

  if (tableWidth && tableWidth > 0) {
    aboveTable = OVER_TABLE_GAP_CM;
    notes.push(
      `Hang the bottom of the shade ${OVER_TABLE_GAP_CM.min}-${OVER_TABLE_GAP_CM.max}cm above the tabletop. Lower than that and it blocks the eye line across the table; higher and it stops lighting the table at all.`,
    );
  } else {
    bottomAboveFloor = MIN_HEADROOM_CM;
    if (ceilingHeight && ceilingHeight > BASE_CEILING_CM) {
      // Roughly 7.5cm of extra drop per foot of ceiling above 8ft.
      const extra = round(((ceilingHeight - BASE_CEILING_CM) / 30.5) * 7.5);
      bottomAboveFloor = MIN_HEADROOM_CM + extra;
      notes.push(
        `With a ${round(ceilingHeight)}cm ceiling, drop it a further ${extra}cm than you would under a standard ceiling, so the bottom sits around ${bottomAboveFloor}cm from the floor.`,
      );
    } else {
      notes.push(
        `Leave at least ${MIN_HEADROOM_CM}cm of clear headroom beneath it. Below that, tall people duck, and everyone notices.`,
      );
    }
  }

  if (ceilingHeight && ceilingHeight > 0 && ceilingHeight < 240)
    notes.push(
      "Under a low ceiling a flush or semi-flush fitting will serve better than a pendant, which will feel like it is in the way however well it is sized.",
    );

  return { diameter, bottomAboveFloor, aboveTable, basis, notes };
}
