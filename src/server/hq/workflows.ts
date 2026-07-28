/**
 * The order lifecycle engine (docs/kaiku-hq-design.md §3). Workflows are
 * typed constants reviewed in git, not a database-driven builder — at one
 * operator and one product range, a visual workflow editor is overhead a
 * £100M business would eventually want, not a v1 need.
 */

export type OrderStage =
  | "paid"
  | "review"
  | "supplier_notified"
  | "supplier_confirmed"
  | "production"
  | "ready_dispatch"
  | "tracking"
  | "in_transit"
  | "delivered"
  | "follow_up"
  | "review_requested"
  | "closed"
  | "cancelled"
  | "refunded"
  | "on_hold";

export type WorkflowKey =
  | "outdoor_sauna"
  | "indoor_sauna"
  | "cold_plunge"
  | "garden_building"
  | "accessory";

const STAGE_LABELS: Record<OrderStage, string> = {
  paid: "Paid",
  review: "Internal Review",
  supplier_notified: "Supplier Notified",
  supplier_confirmed: "Supplier Confirmed",
  production: "In Production",
  ready_dispatch: "Ready for Dispatch",
  tracking: "Tracking Received",
  in_transit: "In Transit",
  delivered: "Delivered",
  follow_up: "Customer Follow-up",
  review_requested: "Review Requested",
  closed: "Closed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  on_hold: "On Hold",
};

const FULL_WORKFLOW: OrderStage[] = [
  "paid",
  "review",
  "supplier_notified",
  "supplier_confirmed",
  "production",
  "ready_dispatch",
  "tracking",
  "in_transit",
  "delivered",
  "follow_up",
  "review_requested",
  "closed",
];

const NO_PRODUCTION_WORKFLOW: OrderStage[] = FULL_WORKFLOW.filter(
  (stage) => stage !== "production",
);

const ACCESSORY_WORKFLOW: OrderStage[] = [
  "paid",
  "supplier_notified",
  "tracking",
  "delivered",
  "review_requested",
  "closed",
];

const WORKFLOWS: Record<WorkflowKey, OrderStage[]> = {
  outdoor_sauna: FULL_WORKFLOW,
  indoor_sauna: FULL_WORKFLOW,
  garden_building: FULL_WORKFLOW,
  cold_plunge: NO_PRODUCTION_WORKFLOW,
  accessory: ACCESSORY_WORKFLOW,
};

/** Exception states, reachable from any stage — a stalled order must never
 * look like a moving one. */
export const EXCEPTION_STAGES: OrderStage[] = [
  "cancelled",
  "refunded",
  "on_hold",
];

// Only maps categories that actually exist in the catalogue today
// (outdoor-saunas, cold-plunges). Everything else falls back to the
// accessory workflow — adding a new category's mapping here is a one-line
// change when the catalogue grows into indoor saunas or garden buildings.
const CATEGORY_WORKFLOW: Partial<Record<string, WorkflowKey>> = {
  "outdoor-saunas": "outdoor_sauna",
  "cold-plunges": "cold_plunge",
};

// Heaviest-item-wins priority when a cart spans categories — a sauna + a
// cover ships on the sauna's timeline, not the cover's.
const WORKFLOW_WEIGHT: Record<WorkflowKey, number> = {
  garden_building: 4,
  outdoor_sauna: 3,
  indoor_sauna: 3,
  cold_plunge: 2,
  accessory: 1,
};

export function categoryToWorkflow(
  category: string | null | undefined,
): WorkflowKey {
  if (!category) return "accessory";
  return CATEGORY_WORKFLOW[category] ?? "accessory";
}

/** Assigns the order's workflow from its line items' categories — called
 * once at checkout-completed time (see the Stripe webhook). */
export function assignWorkflow(
  categories: (string | null | undefined)[],
): WorkflowKey {
  const workflows = categories.map(categoryToWorkflow);
  return workflows.reduce(
    (heaviest, current) =>
      WORKFLOW_WEIGHT[current] > WORKFLOW_WEIGHT[heaviest] ? current : heaviest,
    "accessory" as WorkflowKey,
  );
}

export function stagesForWorkflow(workflow: string): OrderStage[] {
  return WORKFLOWS[workflow as WorkflowKey] ?? ACCESSORY_WORKFLOW;
}

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage as OrderStage] ?? stage;
}

/** The next stage in this order's workflow, or null if already at the last
 * stage (or in an exception state, which only clears back to a real stage
 * via an explicit action, never "advance"). */
export function nextStage(
  workflow: string,
  currentStage: string,
): OrderStage | null {
  if (EXCEPTION_STAGES.includes(currentStage as OrderStage)) return null;
  const stages = stagesForWorkflow(workflow);
  const index = stages.indexOf(currentStage as OrderStage);
  if (index === -1 || index === stages.length - 1) return null;
  return stages[index + 1]!;
}
