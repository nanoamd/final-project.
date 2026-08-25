import "server-only";

import { emailKindByKey } from "@/lib/emails/catalogue";

import { formatMoney, type OrderEmailData, sharedLeadTime } from "./format";
import type { BuiltEmail } from "./layout";
import { loadEmailTemplate } from "./load-template";
import { buildOrderConfirmationEmail } from "./order-confirmation";
import {
  buildStageEmail,
  emailKeyForStage,
  type StageContext,
  stageVariables,
} from "./order-stage";
import {
  type EmailVariables,
  type OrderSummaryLine,
  renderTemplate,
} from "./template-renderer";

/**
 * Decides which email to send, and where it came from.
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
  /** The `emailTemplate` key this email looks for in Studio. */
  templateKey: string;
}

/** The order lines an `emailOrderSummary` block renders. */
function orderLines(order: OrderEmailData): OrderSummaryLine[] {
  return order.items.map((item) => ({
    description: item.description ?? "Item",
    quantity: item.quantity,
    amount: formatMoney(item.amountTotal ?? 0, order.currency),
    meta: item.leadTime,
  }));
}

/**
 * The shared shape: try the editor's template, fall back to the built-in one.
 *
 * `null` from `renderTemplate` — missing, disabled, empty — always means "send
 * the built-in version", never "send nothing". A transactional email must not
 * fail because somebody was midway through editing it.
 */
async function resolve({
  templateKey,
  variables,
  lines = [],
  fallback,
}: {
  templateKey: string;
  variables: EmailVariables;
  lines?: OrderSummaryLine[];
  fallback: () => BuiltEmail | null;
}): Promise<ResolvedEmail | null> {
  const template = await loadEmailTemplate(templateKey);
  const authored = renderTemplate({ template, variables, orderLines: lines });
  if (authored) return { built: authored, source: "studio", templateKey };

  const built = fallback();
  return built ? { built, source: "built-in", templateKey } : null;
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

  return resolve({
    templateKey,
    variables: stageVariables(order, context),
    lines: orderLines(order),
    fallback: () => buildStageEmail(stage, order, context),
  });
}

/** The variables a confirmation template can use. */
export function confirmationVariables(order: OrderEmailData): EmailVariables {
  return {
    ...stageVariables(order, {}),
    leadTime: sharedLeadTime(order.items),
  };
}

/**
 * The order confirmation, which does not come from the stage machine — the
 * Stripe webhook sends it the moment payment lands.
 *
 * It used to bypass the template system entirely, which made the one email every
 * customer definitely receives the one email that could not be customised, while
 * Studio went on offering a dropdown entry for it. Such a template saved, and
 * then never sent.
 */
export async function resolveConfirmationEmail(
  order: OrderEmailData,
): Promise<ResolvedEmail> {
  const resolved = await resolve({
    templateKey: "order-confirmation",
    variables: confirmationVariables(order),
    lines: orderLines(order),
    fallback: () => buildOrderConfirmationEmail(order),
  });
  // The fallback always returns an email, so this cannot actually be null — but
  // the type says it can, and a payment confirmation is not the place to lean on
  // a non-null assertion.
  return (
    resolved ?? {
      built: buildOrderConfirmationEmail(order),
      source: "built-in",
      templateKey: "order-confirmation",
    }
  );
}

/**
 * A form acknowledgement — newsletter, quote, contact. There is no order behind
 * it, so the variables are whatever the form collected.
 */
export async function resolveFormEmail({
  templateKey,
  variables,
  fallback,
}: {
  templateKey: string;
  variables: EmailVariables;
  fallback: () => BuiltEmail;
}): Promise<ResolvedEmail> {
  if (!emailKindByKey(templateKey)) {
    // A key with no catalogue entry is a programming mistake, not a runtime
    // condition — but sending the built-in email beats throwing inside a form
    // submission that has already been saved.
    console.warn(`[email] "${templateKey}" is not in the email catalogue`);
    return { built: fallback(), source: "built-in", templateKey };
  }
  const resolved = await resolve({ templateKey, variables, fallback });
  return resolved ?? { built: fallback(), source: "built-in", templateKey };
}
