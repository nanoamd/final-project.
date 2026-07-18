import { AppLink } from "@/components/ui/app-link";
import type { SanityCategory, SanityDepartment } from "@/types/sanity-content";

const MAX_CATEGORIES_PER_ROOM = 6;

/**
 * Rooms and their categories are both real Sanity documents (departments and
 * categories, grouped by `departmentSlug`) — nothing here is hardcoded data,
 * so new rooms/categories added in Studio show up automatically. A room with
 * zero categories yet is simply omitted rather than shown empty.
 */
export function ShopMegaMenu({
  rooms,
  categories,
  onNavigate,
}: {
  rooms: SanityDepartment[];
  categories: SanityCategory[];
  onNavigate?: () => void;
}) {
  const columns = rooms
    .map((room) => ({
      room,
      categories: categories.filter((c) => c.departmentSlug === room.slug),
    }))
    .filter((col) => col.categories.length > 0);

  if (!columns.length) return null;

  return (
    <div className="bg-basalt/98 fixed inset-x-0 top-[72px] border-b border-white/10 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1440px] grid-cols-3 gap-x-8 gap-y-10 px-6 py-10 sm:px-8 lg:grid-cols-6 lg:px-12">
        {columns.map(({ room, categories: roomCategories }) => {
          const roomHref = `/shop/room/${room.slug}`;
          const shown = roomCategories.slice(0, MAX_CATEGORIES_PER_ROOM);
          return (
            <div key={room.slug} className="flex flex-col gap-3">
              <AppLink
                href={roomHref}
                onClick={onNavigate}
                className="text-canvas hover:text-brass text-[13px] font-semibold tracking-[0.06em] transition-colors"
              >
                {room.name}
              </AppLink>
              <ul className="flex flex-col gap-2.5">
                {shown.map((category) => (
                  <li key={category.slug}>
                    <AppLink
                      href={`/shop/${category.slug}`}
                      onClick={onNavigate}
                      className="text-canvas/60 hover:text-canvas text-[13px] transition-colors"
                    >
                      {category.name}
                    </AppLink>
                  </li>
                ))}
              </ul>
              {roomCategories.length > MAX_CATEGORIES_PER_ROOM ? (
                <AppLink
                  href={roomHref}
                  onClick={onNavigate}
                  className="text-brass text-[12px] font-medium transition-colors hover:underline"
                >
                  View all →
                </AppLink>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
