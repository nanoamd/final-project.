import "server-only";

import { formatMoney, type OrderEmailData } from "./format";
import type { BuiltEmail } from "./layout";
import { loadEmailTemplate } from "./load-template";
import {
  buildStageEmail,
  emailKeyForStage,
  type StageContext,
  stageVariables,
} from "./order-stage";
import { renderTemplate } from "./template-renderer";

/**
 * Decides which email a stage should send, and where it came from.
 *
 * Extracted so the preview page and the real sender share one implementation.
 * That is the whole point: a preview built from its own separate rendering path
 * tells you what the preview looks like, not what the customer gets. Any
 * divergence between the two would be invisible until a customer saw it.
 */
export interface ResolvedEmail {
  built: BuiltEmail;
  /** Which template produced it, so a preview can say so honestly. */
  source: "studio" | "built-in";
  /** The `emailTemplate` key this stage looks for in Studio. */
  templateKey: string;
}

export async function resolveStageEmail({
  stage,
  order,
  context = {},
}: {
  stage: string;
  order: OrderEmailData;
  context?: StageContext;
}): Promise<ResolvedEmail | null> {
  const templateKey = emailKeyForStage(stage);
  // An internal stage. Silence is correct, not a failure.
  if (!templateKey) return null;

  const template = await loadEmailTemplate(templateKey);
  const authored = renderTemplate({
    template,
    variables: stageVariables(order, context),
    orderLines: order.items.map((item) => ({
      description: item.description ?? "Item",
      quantity: item.quantity,
      amount: formatMoney(item.amountTotal ?? 0, order.currency),
      meta: item.leadTime,
    })),
  });

  if (authored) return { built: authored, source: "studio", templateKey };

  const fallback = buildStageEmail(stage, order, context);
  return fallback ? { built: fallback, source: "built-in", templateKey } : null;
}
