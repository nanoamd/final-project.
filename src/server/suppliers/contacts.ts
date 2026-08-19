import "server-only";

import { createClient } from "@sanity/client";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";

/**
 * Supplier trade contacts, and the products' supplier-side codes.
 *
 * Separate from `src/lib/sanity/queries/product.ts` on purpose. That query feeds
 * the storefront, including client components, so everything it projects ends up
 * in the browser — and it used to project supplier `contactName`, `email` and
 * `phone`, which meant a named individual at SaunaPlunge was readable in the
 * page source of every public product page. Contacts are read here instead,
 * where the only callers are admin server actions.
 *
 * Its own client with the CDN off, for the same reason `load-template.ts` has
 * one: an operator who fixes a supplier's email in Studio and immediately sends
 * a purchase order must get the corrected address, not an edge-cached copy.
 */
const supplierClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});

export interface SupplierContact {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  defaultLeadTimeDays: number | null;
  /** Free text — order portal URLs, minimum order terms, quirks. */
  notes: string | null;
}

/** What a purchase order needs to know about one ordered line. */
export interface OrderableProduct {
  slug: string;
  title: string;
  /** Kaiku's own code. */
  sku: string | null;
  /** The supplier's code — what their warehouse picks by. */
  supplierSku: string | null;
  supplierName: string | null;
}

export async function getSupplierContacts(
  names: string[],
): Promise<Map<string, SupplierContact>> {
  const wanted = [...new Set(names.filter(Boolean))];
  if (!wanted.length) return new Map();

  try {
    const rows = await supplierClient.fetch<SupplierContact[]>(
      `*[_type == "supplier" && name in $names && !(_id in path("drafts.**"))]{
        name,
        "contactName": coalesce(contactName, null),
        "email": coalesce(email, null),
        "phone": coalesce(phone, null),
        "defaultLeadTimeDays": coalesce(defaultLeadTimeDays, null),
        "notes": coalesce(notes, null)
      }`,
      { names: wanted },
    );
    return new Map(rows.map((row) => [row.name, row]));
  } catch (error) {
    // An admin screen showing "contact not found" is recoverable; a thrown
    // error on the order page is not.
    console.error("[suppliers] could not load supplier contacts", error);
    return new Map();
  }
}

/**
 * The supplier-side codes for the products on an order, by slug.
 *
 * Read live from Sanity rather than from the order's own line-item snapshot,
 * because `supplierSku` was never captured at checkout. That is the right
 * trade-off for now — the code in Studio is the current, correct one, and an
 * order placed today is fulfilled today — but it does mean an order for a
 * product later deleted from Sanity loses its supplier code. Capturing it into
 * the snapshot at checkout is the durable fix.
 */
export async function getOrderableProducts(
  slugs: string[],
): Promise<Map<string, OrderableProduct>> {
  const wanted = [...new Set(slugs.filter(Boolean))];
  if (!wanted.length) return new Map();

  try {
    const rows = await supplierClient.fetch<OrderableProduct[]>(
      `*[_type == "product" && slug.current in $slugs && !(_id in path("drafts.**"))]{
        "slug": slug.current,
        title,
        "sku": coalesce(sku, null),
        "supplierSku": coalesce(supplierSku, null),
        "supplierName": supplier->name
      }`,
      { slugs: wanted },
    );
    return new Map(rows.map((row) => [row.slug, row]));
  } catch (error) {
    console.error("[suppliers] could not load orderable products", error);
    return new Map();
  }
}
