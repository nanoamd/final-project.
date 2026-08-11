/**
 * Whether a category is shoppable from a room.
 *
 * Checks the full room list rather than the single `departmentSlug`, because a
 * category can belong to several — Wellness Accessories sits under both Sauna and
 * Outdoor Living. Falls back to `departmentSlug` so a category saved before
 * `additionalDepartments` existed still resolves.
 */
export function categoryInRoom(
  category: {
    departmentSlug?: string | null;
    departmentSlugs?: string[] | null;
  },
  roomSlug: string,
): boolean {
  const rooms = category.departmentSlugs?.length
    ? category.departmentSlugs
    : [category.departmentSlug];
  return rooms.includes(roomSlug);
}
