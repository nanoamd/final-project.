"use client";

import Link from "next/link";
import * as React from "react";

import { formatPriceExact } from "@/lib/format";
import {
  addOrderNote,
  advanceOrderStage,
  type HqOrderDetail,
  setOrderStage,
  setOrderTracking,
  setPromisedDates,
  setWarrantyRegistered,
  toggleOrderFlag,
  updateTradeCost,
} from "@/server/actions/hq-orders";
import {
  EXCEPTION_STAGES,
  nextStage,
  stageLabel,
  stagesForWorkflow,
} from "@/server/hq/workflows";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderDetailView({ order }: { order: HqOrderDetail }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  // Separate from the internal `note` above: that one is a private timeline
  // entry, this one goes to the customer in the stage email.
  const [customerNote, setCustomerNote] = React.useState("");
  const [tracking, setTracking] = React.useState({
    carrier: order.trackingCarrier ?? "",
    number: order.trackingNumber ?? "",
    url: order.trackingUrl ?? "",
  });
  const [dates, setDates] = React.useState({
    dispatch: order.promisedDispatchDate ?? "",
    delivery: order.promisedDeliveryDate ?? "",
  });
  const [tradeCost, setTradeCost] = React.useState(
    order.tradeCostTotal != null ? String(order.tradeCostTotal / 100) : "",
  );

  const stages = stagesForWorkflow(order.workflow);
  const isException = EXCEPTION_STAGES.includes(
    order.stage as (typeof EXCEPTION_STAGES)[number],
  );
  const next = nextStage(order.workflow, order.stage);
  const revenue = order.amountTotal;
  const cost = order.tradeCostTotal ?? 0;
  const grossProfit = revenue - cost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : null;

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    setPending(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            ← Orders
          </Link>
          <h1 className="font-display mt-1 text-2xl">
            {formatPriceExact(order.amountTotal / 100)}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(order.createdAt)} · {order.email}
            {order.phone ? ` · ${order.phone}` : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleOrderFlag(order.id, !order.flagged))}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            order.flagged
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
          }`}
        >
          {order.flagged ? "⚑ Flagged" : "Flag for attention"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr_320px]">
        {/* Timeline */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
            Timeline
          </p>
          <ol className="mt-4 flex flex-col gap-4">
            {stages.map((stage) => {
              const stageIndex = stages.indexOf(stage);
              const currentIndex = stages.indexOf(order.stage as typeof stage);
              const done = !isException && stageIndex < currentIndex;
              const current = !isException && stage === order.stage;
              return (
                <li key={stage} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      done
                        ? "border-neutral-900 bg-neutral-900"
                        : current
                          ? "border-neutral-900"
                          : "border-neutral-300"
                    }`}
                  />
                  <span
                    className={`text-sm ${current ? "font-medium text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"}`}
                  >
                    {stageLabel(stage)}
                  </span>
                </li>
              );
            })}
          </ol>

          {isException ? (
            <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
              Exception state: {stageLabel(order.stage)}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-5">
            {/* Goes into the email this stage change sends, wherever the
                template puts {{customerNote}}. Cleared after it is used so the
                next stage change cannot accidentally repeat it. */}
            <label
              htmlFor="customer-note"
              className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase"
            >
              Add to the customer&rsquo;s email
            </label>
            <textarea
              id="customer-note"
              rows={3}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Optional — why it is delayed, what has been agreed, anything specific to this order."
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-700 placeholder:text-neutral-400"
            />
            <p className="mb-1 text-[11px] text-neutral-400">
              Appears in the email as{" "}
              <code className="text-neutral-500">{"{{customerNote}}"}</code>,
              and is saved to this order&rsquo;s timeline. Leave it empty and
              the email sends without it.
            </p>

            {next ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const result = await advanceOrderStage(
                      order.id,
                      customerNote,
                    );
                    if (result.ok) setCustomerNote("");
                    return result;
                  })
                }
                className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                Advance to {stageLabel(next)}
              </button>
            ) : !isException ? (
              <p className="text-xs text-neutral-400">Final stage reached.</p>
            ) : null}

            <select
              disabled={pending}
              value=""
              onChange={(e) => {
                if (e.target.value)
                  run(async () => {
                    const result = await setOrderStage(
                      order.id,
                      e.target.value,
                      customerNote,
                    );
                    if (result.ok) setCustomerNote("");
                    return result;
                  });
              }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600"
            >
              <option value="">Set stage manually…</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
              {EXCEPTION_STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Facts */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
              Line items
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {order.lineItems.map((item, i) => (
                <li key={i} className="text-sm">
                  <p className="text-neutral-900">
                    {item.quantity ? `${item.quantity} × ` : ""}
                    {item.description ?? "Item"}
                  </p>
                  <p className="text-neutral-500">
                    {item.sku ? `SKU ${item.sku}` : "SKU unknown"}
                    {item.supplier ? ` · ${item.supplier}` : ""}
                    {item.slug ? (
                      <>
                        {" · "}
                        <a
                          href={`/shop/${item.category}/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2"
                        >
                          View product
                        </a>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Revenue</span>
                <span className="tabular-nums">
                  {formatPriceExact(revenue / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-neutral-500">Trade cost</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">£</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tradeCost}
                    onChange={(e) => setTradeCost(e.target.value)}
                    className="w-24 rounded border border-neutral-200 px-2 py-1 text-right tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        updateTradeCost(
                          order.id,
                          Math.round(parseFloat(tradeCost || "0") * 100),
                        ),
                      )
                    }
                    className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:border-neutral-400"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="flex justify-between font-medium text-neutral-900">
                <span>Gross profit</span>
                <span className="tabular-nums">
                  {formatPriceExact(grossProfit / 100)}
                  {margin != null ? ` (${margin.toFixed(0)}%)` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
              Logistics
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">
                  Promised dispatch
                </span>
                <input
                  type="date"
                  value={dates.dispatch}
                  onChange={(e) =>
                    setDates((d) => ({ ...d, dispatch: e.target.value }))
                  }
                  className="rounded border border-neutral-200 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">
                  Promised delivery
                </span>
                <input
                  type="date"
                  value={dates.delivery}
                  onChange={(e) =>
                    setDates((d) => ({ ...d, delivery: e.target.value }))
                  }
                  className="rounded border border-neutral-200 px-2 py-1"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() =>
                  setPromisedDates(order.id, {
                    dispatchDate: dates.dispatch || undefined,
                    deliveryDate: dates.delivery || undefined,
                  }),
                )
              }
              className="mt-2 rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400"
            >
              Save dates
            </button>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4 text-sm">
              <input
                placeholder="Carrier"
                value={tracking.carrier}
                onChange={(e) =>
                  setTracking((t) => ({ ...t, carrier: e.target.value }))
                }
                className="rounded border border-neutral-200 px-2 py-1"
              />
              <input
                placeholder="Tracking number"
                value={tracking.number}
                onChange={(e) =>
                  setTracking((t) => ({ ...t, number: e.target.value }))
                }
                className="rounded border border-neutral-200 px-2 py-1"
              />
              <input
                placeholder="Tracking URL"
                value={tracking.url}
                onChange={(e) =>
                  setTracking((t) => ({ ...t, url: e.target.value }))
                }
                className="rounded border border-neutral-200 px-2 py-1"
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() =>
                  setOrderTracking(order.id, {
                    carrier: tracking.carrier,
                    number: tracking.number,
                    url: tracking.url,
                  }),
                )
              }
              className="mt-2 rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400"
            >
              Save tracking
            </button>

            {order.actualDispatchDate || order.actualDeliveryDate ? (
              <p className="mt-3 text-xs text-neutral-500">
                {order.actualDispatchDate
                  ? `Dispatched ${formatDateOnly(order.actualDispatchDate)}. `
                  : ""}
                {order.actualDeliveryDate
                  ? `Delivered ${formatDateOnly(order.actualDeliveryDate)}.`
                  : ""}
              </p>
            ) : null}
          </div>

          {order.shippingAddress ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
                Delivery address
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                {order.shippingAddress.name}
                <br />
                {[
                  order.shippingAddress.address.line1,
                  order.shippingAddress.address.line2,
                  order.shippingAddress.address.city,
                  order.shippingAddress.address.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : null}
        </div>

        {/* The work */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
              Warranty
            </p>
            {order.warrantyRegisteredAt ? (
              <p className="mt-2 text-sm text-neutral-700">
                Registered {formatDate(order.warrantyRegisteredAt)}
              </p>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setWarrantyRegistered(order.id))}
                className="mt-2 rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400"
              >
                Mark warranty registered
              </button>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
              Notes & activity
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="mt-3 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={async () => {
                await run(() => addOrderNote(order.id, note));
                setNote("");
              }}
              className="mt-2 rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400 disabled:opacity-50"
            >
              Add note
            </button>

            <ul className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4">
              {[...order.events].reverse().map((event) => (
                <li key={event.id} className="text-sm">
                  <p className="text-neutral-900">{event.title}</p>
                  {event.detail ? (
                    <p className="text-neutral-500">{event.detail}</p>
                  ) : null}
                  <p className="text-xs text-neutral-400">
                    {formatDate(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
