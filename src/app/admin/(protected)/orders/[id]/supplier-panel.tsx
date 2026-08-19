"use client";

import * as React from "react";

import {
  sendSupplierOrder,
  type SupplierOrderDraft,
} from "@/server/actions/supplier-orders";

/**
 * The "order it from the supplier" panel.
 *
 * Two steps on purpose: read the draft, then send it. A purchase order is an
 * outward-facing commitment to a trade supplier — one press with no preview is
 * how the wrong SKU gets ordered — so the exact email is shown first, along with
 * whatever is missing from it.
 *
 * The preview is an `iframe` with `srcDoc` for the same reason /admin/emails
 * uses one: this is a full email document of table layout and inline styles, and
 * dropping it into the admin page would inherit the admin's CSS and show you
 * something that is neither.
 */
export function SupplierPanel({
  orderId,
  drafts,
}: {
  orderId: string;
  drafts: SupplierOrderDraft[];
}) {
  if (!drafts.length) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
          Supplier
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          No line items on this order, so there is nothing to order.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {drafts.map((draft) => (
        <SupplierBlock
          key={draft.supplierName}
          orderId={orderId}
          draft={draft}
        />
      ))}
    </div>
  );
}

function SupplierBlock({
  orderId,
  draft,
}: {
  orderId: string;
  draft: SupplierOrderDraft;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(draft.alreadySentAt);

  const canSend = draft.supplierEmail !== null;

  async function handleSend() {
    // Sending twice orders twice. Cheap to ask, expensive to get wrong.
    if (
      sent &&
      !window.confirm(
        `This order was already sent to ${draft.supplierName}. Send it again?`,
      )
    )
      return;

    setPending(true);
    setResult(null);
    try {
      const outcome = await sendSupplierOrder(orderId, draft.supplierName);
      setResult(
        outcome.ok
          ? (outcome.message ?? "Sent.")
          : (outcome.error ?? "Failed."),
      );
      if (outcome.ok) setSent(new Date().toISOString());
    } catch {
      setResult("Could not send — check the deploy logs.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.08em] text-neutral-400 uppercase">
          Order from supplier
        </p>
        {sent ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
            Sent{" "}
            {new Date(sent).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm font-medium text-neutral-900">
        {draft.supplierName}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {draft.supplierEmail ? (
          <>
            {draft.contactName ? `${draft.contactName} · ` : ""}
            {draft.supplierEmail}
          </>
        ) : (
          <span className="text-amber-700">
            No email recorded. Add one in Studio → Catalog → Suppliers, then
            reload.
          </span>
        )}
      </p>

      {draft.notes ? (
        <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-[11px] leading-relaxed text-neutral-600">
          {draft.notes}
        </p>
      ) : null}

      {draft.problems.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {draft.problems.map((problem, index) => (
            <li
              key={index}
              className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900"
            >
              {problem.detail}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 transition-colors hover:border-neutral-400"
        >
          {open ? "Hide the email" : "Read the email first"}
        </button>
        <button
          type="button"
          disabled={pending || !canSend}
          onClick={handleSend}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
        >
          {pending ? "Sending…" : sent ? "Send again" : "Send the order"}
        </button>
      </div>

      {result ? (
        <p role="status" className="mt-2 text-xs text-neutral-600">
          {result}
        </p>
      ) : null}

      {open ? (
        <div className="mt-3">
          <p className="text-[11px] text-neutral-400">
            Subject: <span className="text-neutral-600">{draft.subject}</span>
          </p>
          <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <iframe
              title={`Purchase order to ${draft.supplierName}`}
              srcDoc={draft.html}
              sandbox=""
              className="block h-[420px] w-full border-0"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
