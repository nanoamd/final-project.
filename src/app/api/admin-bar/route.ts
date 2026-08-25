import { NextResponse } from "next/server";

import { getAuthorizedAdmin } from "@/server/auth/admin";

/**
 * Whether the caller is an admin, and the shortcuts to show them.
 *
 * The admin bar used to be a Server Component in the storefront layout. That was
 * wrong in a way only a running server showed: product pages are statically
 * prerendered (`● /shop/[category]/[product]`), and reading cookies in a layout
 * above them makes that impossible — every prerendered product page began
 * returning 500 with `DYNAMIC_SERVER_USAGE`. Static product pages are the whole
 * SEO and speed story of this site; a shortcut for one person must not cost them.
 *
 * So the check moved here, to a route the storefront fetches after it has loaded.
 * The pages stay static and the bar appears a moment later, for one person.
 *
 * The links come from this response rather than being hardcoded in the client
 * component, so the admin paths are not sitting in a public JavaScript bundle.
 * They are guessable and the gate is what protects them — but there is no reason
 * to publish the list.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let admin: Awaited<ReturnType<typeof getAuthorizedAdmin>> = null;
  try {
    admin = await getAuthorizedAdmin();
  } catch (error) {
    // A misconfigured Supabase env must not turn into a failing request on every
    // storefront page load.
    console.error("[admin-bar] could not resolve the admin identity", error);
  }

  // 204 for everyone else: no body, nothing to read, nothing cached.
  if (!admin) {
    return new NextResponse(null, {
      status: 204,
      headers: { "cache-control": "no-store" },
    });
  }

  return NextResponse.json(
    {
      email: admin.email,
      role: admin.role,
      links: [
        { label: "Dashboard", href: "/admin", icon: "dashboard" },
        { label: "Orders", href: "/admin/orders", icon: "orders" },
        { label: "Emails", href: "/admin/emails", icon: "emails" },
        { label: "Studio", href: "/studio", icon: "studio" },
      ],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
