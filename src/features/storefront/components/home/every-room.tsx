import Link from "next/link";

import { getRoomBreadth } from "@/lib/sanity/queries/rooms";

/**
 * The whole house, said in the first screen.
 *
 * ## The problem this fixes
 *
 * Damien: _"it also takes too long to realise we sell products for every room,
 * not just outdoors."_ He is right, and the catalogue proves it:
 *
 * | Indoors     |     | Outdoors        |     |
 * | ----------- | --: | --------------- | --: |
 * | Living Room | 188 | Outdoor Living  | 231 |
 * | Decor       | 141 | Sauna           |  13 |
 * | Lighting    | 137 | Outdoor Kitchen |   3 |
 * | Kitchen     |  74 | Cold Plunge     |   1 |
 * | Bedroom     |  53 |                 |     |
 * | Bathroom    |  48 |                 |     |
 * | Office      |  19 |                 |     |
 * | **660**     |     | **248**         |     |
 *
 * **73% of the catalogue is indoors**, and the homepage was leading with a
 * sauna — one of thirteen. The department order in Sanity compounds it:
 * Outdoor Living sorts at 0, Sauna at 1, Cold Plunge at 2, Outdoor Kitchen at
 * 3, and Living Room does not appear until 4, so the navigation itself opens
 * on four outdoor rooms before reaching the biggest indoor one.
 *
 * ## Why the two groups, rather than one tidy grid
 *
 * The split is the information. A single rail ordered by size would put
 * Outdoor Living first and quietly repeat the mistake; a single rail ordered
 * by hand would be an arbitrary sequence a reader cannot decode. Two labelled
 * groups with their totals encode the true shape of the shop — mostly
 * indoors, with a serious garden range — and answer the question in one
 * glance rather than one scroll.
 *
 * Counts are live from Sanity. A room with fewer than five pieces is left out:
 * a tile reading "1 piece" undersells the shop more than its absence does.
 */

/** Rooms that are outside. Everything else is treated as indoors. */
const OUTDOOR_SLUGS = new Set([
  "outdoor-living",
  "sauna",
  "cold-plunge",
  "outdoor-kitchen",
]);

/** Below this, a room tile reads as an empty shop rather than a small range. */
const MIN_PIECES = 5;

export async function EveryRoom() {
  const rooms = (await getRoomBreadth()).filter(
    (room) => room.count >= MIN_PIECES,
  );
  if (rooms.length === 0) return null;

  const indoors = rooms.filter((room) => !OUTDOOR_SLUGS.has(room.slug));
  const outdoors = rooms.filter((room) => OUTDOOR_SLUGS.has(room.slug));
  const total = rooms.reduce((sum, room) => sum + room.count, 0);
  const indoorTotal = indoors.reduce((sum, room) => sum + room.count, 0);

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="max-w-xl">
            <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
              Every room
            </p>
            <h2 className="text-ink font-display mt-3 text-[26px] leading-[1.15] sm:text-[32px]">
              Not just the garden
            </h2>
          </div>
          <p className="text-graphite hq-num text-[13px]">
            {total.toLocaleString("en-GB")} pieces &middot;{" "}
            {indoorTotal.toLocaleString("en-GB")} of them for indoors
          </p>
        </div>

        <RoomGroup label="Indoors" rooms={indoors} />
        <RoomGroup label="Outdoors" rooms={outdoors} />
      </div>
    </section>
  );
}

function RoomGroup({
  label,
  rooms,
}: {
  label: string;
  rooms: { title: string; slug: string; count: number }[];
}) {
  if (rooms.length === 0) return null;

  return (
    <div className="mt-9 sm:mt-12">
      <p className="text-muted text-[11px] font-medium tracking-[0.18em] uppercase">
        {label}
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
        {rooms.map((room) => (
          <li key={room.slug}>
            <Link
              href={`/shop/room/${room.slug}`}
              className="border-line hover:border-brass focus-visible:border-brass group flex items-baseline justify-between gap-3 border-t py-3.5 transition-colors"
            >
              <span className="text-ink group-hover:text-brass text-[15px] transition-colors">
                {room.title}
              </span>
              <span className="text-muted text-[12px] tabular-nums">
                {room.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
