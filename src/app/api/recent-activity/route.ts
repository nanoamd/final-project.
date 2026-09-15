import { NextResponse } from "next/server";

import { getRecentActivity } from "@/server/storefront/recent-activity";

/**
 * The live activity feed's data, for the widget in the corner of every page.
 *
 * A route handler rather than a server read in the site layout, for two
 * reasons. A Supabase read in the layout would make every storefront page
 * dynamic, which is a large price for a small ornament. And revalidating here
 * means one database read a minute however much traffic arrives, instead of
 * one per page view.
 *
 * Sixty seconds is also about how fresh "live" needs to be. The widget shows
 * relative times, so an item a minute stale still reads correctly.
 */
export const revalidate = 60;

export async function GET() {
  const items = await getRecentActivity();
  return NextResponse.json(
    { items },
    {
      headers: {
        // Serve from cache for a minute, then refresh in the background rather
        // than making one unlucky visitor wait for the database.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
