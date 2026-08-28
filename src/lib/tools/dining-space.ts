/**
 * Will the dining set fit, and how many will it actually seat?
 *
 * Two numbers decide it, and neither is the table's own size:
 *
 *   - Circulation. A chair pulled out and a person standing behind it needs
 *     about 90cm from the table edge to whatever is behind. 75cm works if
 *     nobody has to walk past; below 75cm someone is climbing over a chair.
 *   - Place settings. A comfortable setting is 60cm of table edge. 55cm is
 *     tight but workable for a family; below 50cm elbows touch.
 *
 * Corners are the detail people miss on rectangular tables: the last 20cm at
 * each end of a long side is unusable because it collides with whoever is
 * sitting at the head.
 */

/** Clearance from table edge to wall, for a chair plus someone walking past. */
export const CIRCULATION_COMFORTABLE_CM = 90;
/** Clearance where nobody needs to get past a seated diner. */
export const CIRCULATION_TIGHT_CM = 75;
/** Table edge per comfortable place setting. */
export const SETTING_COMFORTABLE_CM = 60;
/** Table edge per setting when squeezing a family in. */
export const SETTING_TIGHT_CM = 50;

export interface DiningSpaceInput {
  /** Available space width in cm — the patio, deck or room. */
  spaceWidth?: number;
  /** Available space length in cm. */
  spaceLength?: number;
  /** Table width in cm, if they have one in mind. */
  tableWidth?: number;
  /** Table length in cm. */
  tableLength?: number;
  /** True where one side sits against a wall or boundary, so only three sides need clearance. */
  againstWall?: boolean;
}

export interface DiningSpaceResult {
  /** The largest table the space takes, at comfortable clearance. */
  maxTable?: { width: number; length: number };
  /** Whether the table they named fits, and how. */
  fit?: "comfortable" | "tight" | "no";
  /** Seats at the table they named. */
  seats?: { comfortable: number; maximum: number };
  notes: string[];
}

const clampFloor = (n: number) => Math.max(Math.floor(n), 0);

/** Usable edge on a rectangular table, allowing for corner collisions. */
function seatsForTable(width: number, length: number) {
  const isRound = Math.abs(width - length) < 10;
  if (isRound) {
    const circumference = Math.PI * width;
    return {
      comfortable: clampFloor(circumference / SETTING_COMFORTABLE_CM),
      maximum: clampFloor(circumference / SETTING_TIGHT_CM),
    };
  }
  // Long sides lose 20cm at each end to the heads of the table.
  const longSide = Math.max(length - 40, 0) * 2;
  const heads = width >= 80 ? 2 : 0;
  return {
    comfortable: clampFloor(longSide / SETTING_COMFORTABLE_CM) + heads,
    maximum: clampFloor(longSide / SETTING_TIGHT_CM) + heads,
  };
}

export function diningSpace(input: DiningSpaceInput): DiningSpaceResult | null {
  const { spaceWidth, spaceLength, tableWidth, tableLength, againstWall } =
    input;
  const notes: string[] = [];
  const result: DiningSpaceResult = { notes };
  /**
   * Whether we had enough input to say anything at all.
   *
   * Tracked separately from whether a table fits, because "nothing fits this
   * space, here is what to do instead" is the most useful answer this can give
   * and an earlier version returned null for it — throwing the advice away
   * exactly when it was needed.
   */
  let answered = false;

  if (spaceWidth && spaceWidth > 0 && spaceLength && spaceLength > 0) {
    // Clearance is needed on both sides of each axis, unless against a wall.
    const sidesWidth = againstWall ? 1 : 2;
    const maxWidth = spaceWidth - CIRCULATION_COMFORTABLE_CM * sidesWidth;
    const maxLength = spaceLength - CIRCULATION_COMFORTABLE_CM * 2;
    answered = true;
    if (maxWidth > 40 && maxLength > 40) {
      result.maxTable = {
        width: clampFloor(maxWidth),
        length: clampFloor(maxLength),
      };
      notes.push(
        `That leaves ${CIRCULATION_COMFORTABLE_CM}cm around ${againstWall ? "the three open sides" : "every side"} — enough to pull a chair out and walk behind it.`,
      );
    } else {
      notes.push(
        `At ${CIRCULATION_COMFORTABLE_CM}cm of clearance there is no table that fits this space. Dropping to ${CIRCULATION_TIGHT_CM}cm works if nobody needs to walk behind a seated diner, and a bench on one side removes the problem entirely because it slides under.`,
      );
    }
  }

  if (tableWidth && tableWidth > 0 && tableLength && tableLength > 0) {
    answered = true;
    result.seats = seatsForTable(tableWidth, tableLength);
    notes.push(
      `Seat count allows ${SETTING_COMFORTABLE_CM}cm of table edge per person comfortably, ${SETTING_TIGHT_CM}cm at a push.`,
    );

    if (spaceWidth && spaceLength) {
      const sidesWidth = againstWall ? 1 : 2;
      const needComfortableW =
        tableWidth + CIRCULATION_COMFORTABLE_CM * sidesWidth;
      const needComfortableL = tableLength + CIRCULATION_COMFORTABLE_CM * 2;
      const needTightW = tableWidth + CIRCULATION_TIGHT_CM * sidesWidth;
      const needTightL = tableLength + CIRCULATION_TIGHT_CM * 2;
      result.fit =
        spaceWidth >= needComfortableW && spaceLength >= needComfortableL
          ? "comfortable"
          : spaceWidth >= needTightW && spaceLength >= needTightL
            ? "tight"
            : "no";
      if (result.fit === "tight")
        notes.push(
          "It fits, but only at tight clearance. That is fine against a wall or with a bench on one side; it is uncomfortable if people need to walk all the way round.",
        );
      if (result.fit === "no")
        notes.push(
          "It does not fit with usable clearance. A round table of the same seating capacity takes less room than a rectangular one, because there are no corners to walk around.",
        );
    }
  }

  return answered ? result : null;
}
