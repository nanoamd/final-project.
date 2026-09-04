"use client";

import * as React from "react";

import {
  getSupplierReturnRequestDrafts,
  sendSupplierReturnRequest,
  type SupplierReturnRequestDraft,
} from "@/server/actions/supplier-return-request";

/**
 * "Notify supplier" for one return, inline in its table row.
 *
 * Same two-step read-then-send shape as the order page's supplier panel,
 * for the same reason: this is an outward-facing message to a trade
 * supplier, not something to fire blind. Condensed for a table cell rather
 * than a full page section — drafts are fetched lazily on first expand
 * rather than for every row on page load, since a returns queue can run to
 * hundreds of rows and most will never be expanded.
 */
export function SupplierReturnCell({ returnId }: { returnId: string }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [drafts, setDrafts] = React.useState<
    SupplierReturnRequestDraft[] | null
  >(null);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (drafts !== null) return;
    setLoading(true);
    try {
      setDrafts(await getSupplierReturnRequestDrafts(returnId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleOpen}
        className="hq-num px-1.5 py-0.5 text-[10px] font-semibold uppercase"
        style={{
          background: "transparent",
          border: "1px solid var(--hq-line)",
          color: "var(--hq-faint)",
        }}
      >
        {open ? "Hide" : "Notify supplier"}
      </button>

      {open ? (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {loading ? (
            <span className="text-[11px]" style={{ color: "var(--hq-faint)" }}>
              Loading…
            </span>
          ) : !drafts || drafts.length === 0 ? (
            <span className="text-[11px]" style={{ color: "var(--hq-faint)" }}>
              No supplier found for this return&apos;s items.
            </span>
          ) : (
            drafts.map((draft) => (
              <SupplierDraftRow
                key={draft.supplierName}
                returnId={returnId}
                draft={draft}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function SupplierDraftRow({
  returnId,
  draft,
}: {
  returnId: string;
  draft: SupplierReturnRequestDraft;
}) {
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(draft.alreadySentAt);
  const [preview, setPreview] = React.useState(false);

  const canSend = draft.supplierEmail !== null;

  async function handleSend() {
    if (
      sent &&
      !window.confirm(
        `A return request was already sent to ${draft.supplierName} for this return. Send it again?`,
      )
    )
      return;

    setPending(true);
    setResult(null);
    try {
      const outcome = await sendSupplierReturnRequest(
        returnId,
        draft.supplierName,
      );
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
    <div
      className="rounded border p-1.5"
      style={{ borderColor: "var(--hq-line)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px]" style={{ color: "var(--hq-text)" }}>
          {draft.supplierName}
        </span>
        {sent ? (
          <span className="text-[10px]" style={{ color: "var(--hq-up)" }}>
            Sent{" "}
            {new Date(sent).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : null}
      </div>
      {!draft.supplierEmail ? (
        <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--hq-warn)" }}>
          No email recorded — add one in Studio → Suppliers.
        </p>
      ) : null}
      {draft.problems.length > 0 ? (
        <ul className="mt-0.5 flex flex-col gap-0.5">
          {draft.problems.map((problem, index) => (
            <li
              key={index}
              className="text-[10.5px]"
              style={{ color: "var(--hq-warn)" }}
            >
              {problem.detail}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="text-[10px] underline"
          style={{ color: "var(--hq-faint)" }}
        >
          {preview ? "hide email" : "read the email first"}
        </button>
        <button
          type="button"
          disabled={pending || !canSend}
          onClick={handleSend}
          className="hq-num px-1.5 py-0.5 text-[10px] font-semibold uppercase disabled:opacity-40"
          style={{ background: "var(--hq-accent)", color: "#14100e" }}
        >
          {pending ? "Sending…" : sent ? "Send again" : "Send"}
        </button>
      </div>
      {result ? (
        <p
          role="status"
          className="mt-0.5 text-[10.5px]"
          style={{ color: "var(--hq-dim)" }}
        >
          {result}
        </p>
      ) : null}
      {preview ? (
        <div
          className="mt-1 overflow-hidden rounded border"
          style={{ borderColor: "var(--hq-line)" }}
        >
          <iframe
            title={`Return request to ${draft.supplierName}`}
            srcDoc={draft.html}
            sandbox=""
            className="block h-[320px] w-full border-0"
          />
        </div>
      ) : null}
    </div>
  );
}
