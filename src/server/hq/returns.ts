/**
 * Pure return-status logic, kept out of `server/actions/hq-returns.ts` because
 * that file has `"use server"` at the top — every export from a Server
 * Actions module must itself be an async action, and `nextReturnStatuses` is
 * a plain lookup the page calls during render, not a mutation. Same split as
 * `server/hq/workflows.ts` next to `server/actions/hq-orders.ts`.
 */

export type ReturnStatus =
  | "requested"
  | "approved"
  | "awaiting_item"
  | "received"
  | "refunded"
  | "replaced"
  | "rejected";

export const TERMINAL_RETURN_STATUSES: ReturnStatus[] = [
  "refunded",
  "replaced",
  "rejected",
];

const NEXT_STATUS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["awaiting_item", "received", "rejected"],
  awaiting_item: ["received", "rejected"],
  received: ["refunded", "replaced", "rejected"],
  refunded: [],
  replaced: [],
  rejected: [],
};

export function nextReturnStatuses(status: ReturnStatus): ReturnStatus[] {
  return NEXT_STATUS[status];
}
