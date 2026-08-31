import Link from "next/link";

import {
  type HqReturn,
  listReturns,
  updateReturnStatus,
} from "@/server/actions/hq-returns";
import { nextReturnStatuses, type ReturnStatus } from "@/server/hq/returns";

/**
 * The returns queue. Design: docs/kaiku-hq-design.md §3.
 *
 * A return already gets an automatic accept/review/decline the moment a
 * customer requests it (`server/actions/returns.ts`) — this page is for what
 * happens after that first read: moving it through approved → awaiting the
 * item → received → refunded/replaced/rejected, which nothing currently does.
 */
export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "resolved" ? "resolved" : "open";
  const lists = await listReturns();
  const rows = lists[tab];

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Returns</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {lists.open.length} open
        </span>
      </div>

      <div
        className="flex gap-1 px-2.5 py-1.5"
        style={{ borderBottom: "1px solid var(--hq-line)" }}
      >
        <TabLink tab="open" active={tab === "open"} count={lists.open.length} />
        <TabLink
          tab="resolved"
          active={tab === "resolved"}
          count={lists.resolved.length}
        />
      </div>

      {rows.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          {tab === "open"
            ? "No open returns. New requests land here the moment a customer submits one."
            : "Nothing resolved yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                <Th>Ref</Th>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Reason</Th>
                <Th>Assessment</Th>
                <Th>Placed</Th>
                <Th>Status</Th>
                {tab === "open" ? <Th>Move to</Th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((ret) => (
                <ReturnRow
                  key={ret.id}
                  ret={ret}
                  showActions={tab === "open"}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TabLink({
  tab,
  active,
  count,
}: {
  tab: "open" | "resolved";
  active: boolean;
  count: number;
}) {
  return (
    <Link
      href={`/admin/returns?tab=${tab}`}
      className="hq-label px-2 py-1"
      style={{
        color: active ? "var(--hq-accent)" : "var(--hq-faint)",
        borderBottom: active
          ? "1px solid var(--hq-accent)"
          : "1px solid transparent",
      }}
    >
      {tab} {count > 0 ? `(${count})` : ""}
    </Link>
  );
}

const DECISION_COLOUR: Record<HqReturn["decision"], string> = {
  accept: "var(--hq-up)",
  review: "var(--hq-warn)",
  decline: "var(--hq-down)",
};

const STATUS_COLOUR: Record<ReturnStatus, string> = {
  requested: "var(--hq-warn)",
  approved: "var(--hq-info)",
  awaiting_item: "var(--hq-info)",
  received: "var(--hq-info)",
  refunded: "var(--hq-up)",
  replaced: "var(--hq-up)",
  rejected: "var(--hq-down)",
};

function ReturnRow({
  ret,
  showActions,
}: {
  ret: HqReturn;
  showActions: boolean;
}) {
  const options = nextReturnStatuses(ret.status);

  return (
    <tr className="hq-row hq-row-hover align-top">
      <Td>
        <span className="hq-num" style={{ color: "var(--hq-text)" }}>
          {ret.returnNumber}
        </span>
      </Td>
      <Td>
        {ret.orderNumber ? (
          <Link
            href={`/admin/orders/${ret.orderId}`}
            className="hq-num"
            style={{ color: "var(--hq-accent)" }}
          >
            {ret.orderNumber}
          </Link>
        ) : (
          <span style={{ color: "var(--hq-faint)" }}>—</span>
        )}
      </Td>
      <Td dim>
        <span className="block max-w-[180px] truncate">
          {ret.customerName || ret.email}
        </span>
      </Td>
      <Td dim>{ret.reason.replace(/-/g, " ")}</Td>
      <Td>
        <span
          className="hq-label"
          style={{ color: DECISION_COLOUR[ret.decision] }}
        >
          {ret.decision}
        </span>
        {ret.supplierWindowLikelyClosed ? (
          <span
            className="ml-1"
            title="Supplier return window likely closed"
            style={{ color: "var(--hq-warn)" }}
          >
            ⚑
          </span>
        ) : null}
      </Td>
      <Td dim mono>
        {new Date(ret.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })}
      </Td>
      <Td>
        <span className="hq-label" style={{ color: STATUS_COLOUR[ret.status] }}>
          {ret.status.replace(/_/g, " ")}
        </span>
      </Td>
      {showActions ? (
        <Td>
          {options.length === 0 ? (
            <span style={{ color: "var(--hq-faint)" }}>—</span>
          ) : (
            <form
              action={updateReturnStatus}
              className="flex flex-wrap items-center gap-1"
            >
              <input type="hidden" name="id" value={ret.id} />
              <select
                name="status"
                defaultValue={options[0]}
                className="border px-1 py-0.5 text-[11px]"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {options.includes("refunded") ? (
                <input
                  type="number"
                  name="refundAmount"
                  step="0.01"
                  placeholder="£"
                  className="hq-num w-16 border px-1 py-0.5 text-[11px]"
                />
              ) : null}
              <input
                type="text"
                name="note"
                placeholder="note (optional)"
                className="w-28 border px-1 py-0.5 text-[11px]"
              />
              <button
                type="submit"
                className="hq-num px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                style={{ background: "var(--hq-accent)", color: "#14100e" }}
              >
                Go
              </button>
            </form>
          )}
        </Td>
      ) : null}
    </tr>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th scope="col" className="hq-label px-2.5 py-1.5 text-left">
      {children}
    </th>
  );
}

function Td({
  children,
  dim,
  mono,
}: {
  children?: React.ReactNode;
  dim?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={`px-2.5 py-1.5 align-top ${mono ? "hq-num" : ""}`}
      style={{ color: dim ? "var(--hq-dim)" : "var(--hq-text)" }}
    >
      {children}
    </td>
  );
}
