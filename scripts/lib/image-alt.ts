/**
 * Writes alt text for a gallery image from what the product document already
 * knows about it.
 *
 * 261 of 439 catalogue images have no alt text. That is a real cost on three
 * counts: a screen reader announces the filename or nothing at all, Google Images
 * has nothing to index, and the brief asks for it explicitly.
 *
 * **The rule this module exists to enforce: describe only what the document can
 * prove.** It is very easy to generate "Abberley coffee table styled in a
 * sunlit Scandinavian living room with a linen sofa" for an image nobody has
 * looked at. That is a fabrication, it will sometimes be wrong, and wrong alt
 * text is worse than none — a blind visitor has no way to tell they have been
 * misled. So the text is assembled from four facts only:
 *
 *   1. the product's name, with the SEO tail and the "| Kaiku" suffix stripped
 *   2. the variant the photo belongs to, when `optionValue` says so
 *   3. whether the photo is on a plain sweep or in a setting, from `isStudioShot`
 *   4. what kind of setting that would be, from the product's department —
 *      a garden, a living room, a sauna
 *
 * Nothing about colour, styling, materials or mood, because the document does
 * not know those about a specific photograph.
 *
 * Existing alt text is never overwritten. An editor who wrote something knows
 * more than this function does.
 */

/**
 * The product's name without its keyword tail or the shop suffix.
 *
 * "Abberley White End Table | Luxury Oak Side Table | Kaiku" is three claims:
 * the name of the thing, a keyword line, and the shop. Alt text gets the first —
 * the keyword line in an alt attribute is exactly the stuffing the brief says to
 * avoid, and "Kaiku" in every alt is 439 repetitions of something the page
 * already says.
 */
export function altProductName(title: string): string {
  const segments = title
    .split("|")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !/^kaiku$/i.test(segment));
  return segments[0] ?? title.trim();
}

/**
 * How to describe a room photograph, by department.
 *
 * Only departments where the setting is genuinely predictable. Lighting is
 * absent on purpose: a table lamp's department says nothing about the room it
 * was photographed in, so those get the neutral wording instead of a guess.
 */
const DEPARTMENT_SETTINGS: Record<string, string> = {
  "living room": "a living room",
  bedroom: "a bedroom",
  kitchen: "a kitchen",
  office: "a home office",
  bathroom: "a bathroom",
  sauna: "a garden sauna setting",
  "outdoor living": "a garden",
  "outdoor kitchen": "an outdoor kitchen",
  "cold plunge": "an outdoor wellness setting",
  garden: "a garden",
};

export interface AltInput {
  /** The product's `title`, SEO tail and all. */
  title: string;
  /** `category->department->title`, when the product has one. */
  department?: string | null;
  /** The gallery entry's `optionValue` — the variant this photo is of. */
  optionValue?: string | null;
  /** The gallery entry's `isStudioShot`. */
  isStudioShot?: boolean | null;
  /** Position in the gallery, zero-based. */
  index: number;
  /**
   * How many earlier images in this gallery are also plain-sweep shots,
   * position zero included. Used to number the additional product views, so five
   * photos of the same table do not all get identical alt text.
   */
  plainBefore: number;
  /** Same, for setting photographs. */
  settingBefore: number;
}

/**
 * " in Black", or nothing when the name already says it.
 *
 * Half the furniture range is named for its finish, so the naive version reads
 * "Abberley White Bedside Table in White". The genuinely useful case is the
 * opposite one — "Abberley White Chest of Drawers in Black" is the photograph of
 * the black finish on a product whose name says white, and a shopper comparing
 * variants needs to be told that.
 */
function variantSuffix(name: string, optionValue: string | null | undefined) {
  const value = optionValue?.trim();
  if (!value) return "";
  const words = name.toLowerCase().split(/[^a-z]+/);
  return words.includes(value.toLowerCase()) ? "" : ` in ${value}`;
}

/**
 * The alt text for one image, or null when there is not enough to say anything
 * useful — an untitled product.
 */
export function buildAlt(input: AltInput): string | null {
  const name = altProductName(input.title);
  if (!name) return null;

  const subject = `${name}${variantSuffix(name, input.optionValue)}`;

  // The lead photo carries the plain name. It is the one that appears in search
  // results and on cards, and the shortest true description is the best one.
  if (input.index === 0) return subject;

  if (input.isStudioShot === true) {
    // "Second view", not "side view": which side it is photographed from is not
    // something the document records.
    const ordinal =
      ORDINALS[input.plainBefore] ?? `view ${input.plainBefore + 1}`;
    return `${subject}, ${ordinal} product view`;
  }

  const setting = input.department
    ? DEPARTMENT_SETTINGS[input.department.trim().toLowerCase()]
    : undefined;
  const where = setting ?? "a styled setting";
  // Numbered only from the second setting photo on, so the common case of one
  // lifestyle shot reads as a sentence rather than as a database row.
  const suffix = input.settingBefore > 0 ? ` (${input.settingBefore + 1})` : "";
  return `${subject} photographed in ${where}${suffix}`;
}

/**
 * Words rather than digits for the first few, because a screen reader saying
 * "second product view" is easier to follow than "view 2".
 */
const ORDINALS = [
  "",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
] as const;

export interface GalleryEntry {
  optionValue?: string | null;
  isStudioShot?: boolean | null;
  alt?: string | null;
}

/**
 * Alt text for a whole gallery, in order. `null` at a position means leave it
 * alone — either it already has alt text, or there is nothing to say.
 *
 * Done for the gallery rather than per image because the numbering needs to know
 * what came before it.
 */
export function buildGalleryAlts(
  title: string,
  department: string | null | undefined,
  gallery: GalleryEntry[],
): (string | null)[] {
  let plainBefore = 0;
  let settingBefore = 0;
  return gallery.map((entry, index) => {
    const alt = buildAlt({
      title,
      department,
      optionValue: entry.optionValue,
      isStudioShot: entry.isStudioShot,
      index,
      plainBefore,
      settingBefore,
    });
    // Counted for position zero too. The lead photo is nearly always the
    // catalogue shot, so the next plain-sweep image is the *second* product
    // view, and skipping it here would make it the first.
    if (entry.isStudioShot === true) plainBefore += 1;
    else settingBefore += 1;
    // Never overwrite an editor's own words.
    return entry.alt?.trim() ? null : alt;
  });
}
