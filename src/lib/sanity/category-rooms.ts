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

/**
 * The categories a shopper should be offered in a room's navigation.
 *
 * A category with no products renders a page with nothing on it, and the
 * accordion tile that links there is labelled with its own product count — so
 * before this filter, `/shop/room/bathroom` offered two tiles reading
 * "0 Products" (Towel Rails, Lighting) and `/shop/room/living-room` offered a
 * third (Rugs). All three link to a page whose only content is the empty state.
 * The category route already sets `noindex` when the count is zero and the
 * sitemap already excludes them; the navigation was the one place still sending
 * shoppers there.
 *
 * The active category is always kept, whatever its count. A shopper who follows
 * an old link or a bookmark to an empty category should still get that page with
 * its hero, its breadcrumb and its empty state pointing onward — not a nav that
 * silently disagrees with the page they are standing on.
 *
 * `productCount` is counted in GROQ against an unauthenticated client, so it is
 * published products only; Sanity does not serve drafts without a token. A
 * category holding nothing but unpublished drafts therefore counts as empty
 * here, which is correct — those products are not buyable.
 */
export function shoppableCategories<
  T extends { slug: string; productCount?: number | null },
>(categories: T[], activeSlug?: string): T[] {
  return categories.filter(
    (category) =>
      category.slug === activeSlug || (category.productCount ?? 0) > 0,
  );
}
