import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { createClient } from "@/lib/supabase/server";
import { listOrders } from "@/server/actions/orders";

export const metadata: Metadata = { title: "Order History" };

function formatOrderTotal(amountTotal: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountTotal / 100);
}

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  const orders = await listOrders();

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <AppLink
        href="/account"
        className="text-muted hover:text-ink text-[13px]"
      >
        ← Account
      </AppLink>
      <Eyebrow className="mt-4">Account</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Order history
      </h1>

      {orders.length === 0 ? (
        <p className="text-muted mt-8 text-[15px]">
          No orders yet — once you complete a checkout while signed in,
          it&rsquo;ll show up here.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="border-line rounded-xl border p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-ink text-lg">
                  {formatOrderTotal(order.amountTotal, order.currency)}
                </p>
                <p className="text-muted text-[13px]">
                  {new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-muted mt-1 text-[13px] tracking-[0.1em] uppercase">
                {order.status}
              </p>
              {order.lineItems.length > 0 ? (
                <ul className="text-ink/80 mt-4 flex flex-col gap-1 text-[14px]">
                  {order.lineItems.map((item, index) => (
                    <li key={index}>
                      {item.quantity ? `${item.quantity} × ` : ""}
                      {item.description ?? "Item"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
