"use server";

import "server-only";

import { createClient } from "@sanity/client";
import { revalidatePath } from "next/cache";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Suppliers (docs/kaiku-hq-design.md §4.7 / §2.3).
 *
 * Two separate records of the same relationship, on purpose (§2.3): Sanity's
 * `supplier` document is the public-facing identity a product references —
 * name, contact, lead time — and Supabase's `suppliers` table is the
 * operational layer HQ needs and the storefront never should: order method,
 * portal URL, payment terms, dispatch SLA. They are joined by name because
 * `sanity_supplier_id` is not populated for every row yet — a supplier that
 * exists in Sanity but has no Supabase row shows up anyway, with an
 * "incomplete profile" prompt rather than being hidden, per the design doc's
 * own edge case for exactly this gap.
 */

const sanity = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});

export interface SupplierListRow {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  leadTimeDays: number | null;
  productCount: number;
  ordersLast90d: number;
  archived: boolean;
  hasOperationalProfile: boolean;
}

interface SanitySupplierRow {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  defaultLeadTimeDays: number | null;
  productCount: number;
}

export async function listSuppliers(): Promise<SupplierListRow[]> {
  if (!(await getAuthorizedAdmin())) return [];

  const sanityRows = await sanity.fetch<SanitySupplierRow[]>(
    `*[_type == "supplier" && !(_id in path("drafts.**"))]{
      name,
      "contactName": coalesce(contactName, null),
      "email": coalesce(email, null),
      "phone": coalesce(phone, null),
      "defaultLeadTimeDays": coalesce(defaultLeadTimeDays, null),
      "productCount": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)])
    }|order(name asc)`,
  );

  const admin = createAdminClient();
  const { data: opsRows, error } = await admin
    .from("suppliers")
    .select("name, default_lead_time_days, archived")
    .limit(500);
  if (error)
    console.warn("[suppliers] could not read suppliers:", error.message);

  const opsByName = new Map(
    (opsRows ?? []).map((r) => [r.name.toLowerCase(), r]),
  );

  const ordersByName = await ordersLast90dBySupplierName();

  return sanityRows.map((row) => {
    const ops = opsByName.get(row.name.toLowerCase());
    return {
      name: row.name,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone,
      leadTimeDays:
        row.defaultLeadTimeDays ?? ops?.default_lead_time_days ?? null,
      productCount: row.productCount,
      ordersLast90d: ordersByName.get(row.name.toLowerCase()) ?? 0,
      archived: Boolean(ops?.archived),
      hasOperationalProfile: Boolean(ops),
    };
  });
}

async function ordersLast90dBySupplierName(): Promise<Map<string, number>> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await admin
    .from("orders")
    .select("line_items")
    .eq("status", "paid")
    .gte("created_at", since.toISOString())
    .limit(1000);

  const counts = new Map<string, number>();
  if (error || !data) return counts;

  for (const order of data) {
    const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
    const names = new Set<string>();
    for (const item of lineItems) {
      const supplier = (item as { supplier?: unknown }).supplier;
      if (typeof supplier === "string" && supplier.trim())
        names.add(supplier.trim().toLowerCase());
    }
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

export interface SupplierProductRow {
  slug: string;
  title: string;
  sku: string | null;
  price: number | null;
  costPrice: number | null;
  marginPct: number | null;
  status: "draft" | "live";
}

export interface SupplierPriceEvent {
  id: string;
  sku: string | null;
  productSlug: string | null;
  oldTradePrice: number | null;
  newTradePrice: number | null;
  effectiveDate: string | null;
  source: string | null;
  createdAt: string;
}

export interface SupplierDetail {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  leadTimeDays: number | null;
  carriageIncludedInCost: boolean;
  sanityNotes: string | null;
  orderMethod: string | null;
  portalUrl: string | null;
  paymentTerms: string | null;
  dispatchSlaDays: number | null;
  returnsPolicy: string | null;
  opsNotes: string | null;
  archived: boolean;
  supabaseId: string | null;
  products: SupplierProductRow[];
  priceHistory: SupplierPriceEvent[];
}

export async function getSupplierDetail(
  name: string,
): Promise<SupplierDetail | null> {
  if (!(await getAuthorizedAdmin())) return null;

  const sanitySupplier = await sanity.fetch<{
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    defaultLeadTimeDays: number | null;
    carriageIncludedInCost: boolean | null;
    notes: string | null;
  } | null>(
    `*[_type == "supplier" && name == $name && !(_id in path("drafts.**"))][0]{
      name,
      "contactName": coalesce(contactName, null),
      "email": coalesce(email, null),
      "phone": coalesce(phone, null),
      "defaultLeadTimeDays": coalesce(defaultLeadTimeDays, null),
      "carriageIncludedInCost": coalesce(carriageIncludedInCost, false),
      "notes": coalesce(notes, null)
    }`,
    { name },
  );
  if (!sanitySupplier) return null;

  const products = await sanity.fetch<
    {
      slug: string;
      title: string;
      sku: string | null;
      price: number | null;
      costPrice: number | null;
      status: "draft" | "live";
    }[]
  >(
    `*[_type == "product" && supplier->name == $name]{
      "slug": slug.current,
      title,
      "sku": coalesce(sku, null),
      "price": coalesce(price, null),
      "costPrice": coalesce(costPrice, null),
      "status": select(_id in path("drafts.**") => "draft", "live")
    }|order(title asc)`,
    { name },
  );

  const admin = createAdminClient();
  const { data: opsRow } = await admin
    .from("suppliers")
    .select(
      "id, order_method, portal_url, payment_terms, dispatch_sla_days, returns_policy, notes, archived",
    )
    .ilike("name", sanitySupplier.name)
    .maybeSingle();

  let priceHistory: SupplierPriceEvent[] = [];
  if (opsRow) {
    const { data: events } = await admin
      .from("supplier_price_events")
      .select(
        "id, sku, product_slug, old_trade_price, new_trade_price, effective_date, source, created_at",
      )
      .eq("supplier_id", opsRow.id)
      .order("effective_date", { ascending: false })
      .limit(100);
    priceHistory = (events ?? []).map((e) => ({
      id: e.id,
      sku: e.sku,
      productSlug: e.product_slug,
      oldTradePrice: e.old_trade_price,
      newTradePrice: e.new_trade_price,
      effectiveDate: e.effective_date,
      source: e.source,
      createdAt: e.created_at,
    }));
  }

  return {
    name: sanitySupplier.name,
    contactName: sanitySupplier.contactName,
    email: sanitySupplier.email,
    phone: sanitySupplier.phone,
    leadTimeDays:
      sanitySupplier.defaultLeadTimeDays ?? opsRow?.dispatch_sla_days ?? null,
    carriageIncludedInCost: Boolean(sanitySupplier.carriageIncludedInCost),
    sanityNotes: sanitySupplier.notes,
    orderMethod: opsRow?.order_method ?? null,
    portalUrl: opsRow?.portal_url ?? null,
    paymentTerms: opsRow?.payment_terms ?? null,
    dispatchSlaDays: opsRow?.dispatch_sla_days ?? null,
    returnsPolicy: opsRow?.returns_policy ?? null,
    opsNotes: opsRow?.notes ?? null,
    archived: Boolean(opsRow?.archived),
    supabaseId: opsRow?.id ?? null,
    products: products.map((p) => ({
      slug: p.slug,
      title: p.title,
      sku: p.sku,
      price: p.price,
      costPrice: p.costPrice,
      marginPct:
        p.price && p.costPrice
          ? +(((p.price - p.costPrice) / p.price) * 100).toFixed(1)
          : null,
      status: p.status,
    })),
    priceHistory,
  };
}

/** Creates the Supabase operational row for a supplier that only exists in
 * Sanity so far — the "complete profile" prompt's action. */
export async function createSupplierProfile(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const admin = createAdminClient();
  await admin.from("suppliers").insert({ name });
  revalidatePath(`/admin/suppliers/${encodeURIComponent(name)}`);
}
