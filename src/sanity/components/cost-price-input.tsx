import { Button, Flex } from "@sanity/ui";
import { useCallback } from "react";
import {
  type NumberInputProps,
  PatchEvent,
  set,
  useClient,
  useFormValue,
} from "sanity";

const DEFAULT_VAT_RATE = 0.2;

/**
 * The cost price field, with the "+VAT" button right next to the box — not
 * in the document action bar. Damien: *"i want the button to be next too
 * the cost price box right enxt to it"*.
 *
 * Same fix as the document action it replaces (`add-supplier-vat.tsx`,
 * removed once this landed): a supplier's trade price list is ex-VAT, they
 * invoice on top of it and Kaiku can't reclaim that, and this is where that
 * belongs — on the field itself, one click, no trip to a checkout to read a
 * tax line. Originally built for Premier Housewares, but this component is
 * wired to every supplier's `costPrice` field, and Damien has since used it
 * on a Hill Interiors product too — the rate button now reads
 * `supplierVatRate` rather than assuming Premier's flat 20%.
 *
 * **Also corrects `shippingCost`, in the same click.** Found the hard way:
 * a Hill product Damien had already run this button on had `costPrice`
 * correctly VAT-adjusted and `costPriceVatCorrected: true`, but a real
 * per-consignment carriage cost of its own — untouched, because this
 * button had only ever known about `costPrice`. That is a fully working
 * product with a genuinely wrong recorded landed cost, sitting live. Every
 * supplier whose carriage runs through `shippingCost` (not just Premier's,
 * which is always 0 and gets a harmless no-op) hits the same gap the moment
 * this button is used on one of their products. Fixed once, here, rather
 * than left for the next reprice script to rediscover — see
 * scripts/fix-hill-interiors-vat-bookkeeping.ts for the sweep that repaired
 * every case this already produced.
 *
 * **Two different writes, on purpose, after the first version of this
 * crashed the whole Studio.** `props.onChange` is scoped to the field it
 * belongs to — this input's own bound path, `costPrice` — and any patch
 * passed through it is prefixed with that path as it bubbles up. The first
 * version tried to also set the sibling `costPriceVatCorrected` flag
 * through that same channel with an explicit path, which doesn't escape the
 * prefixing: it patched `costPrice.costPriceVatCorrected`, a sub-path on a
 * plain number, and the engine had no way to apply that. Damien: *"it
 * crashes everytime i do it"*. The flag (and now `shippingCost`) are
 * genuine sibling fields, so they get their own client patch instead —
 * still lands on the same draft Sanity is already continuously autosaving
 * as you type, so nothing about how this behaves for Damien actually
 * changes; only the plumbing does.
 */
export function CostPriceInput(props: NumberInputProps) {
  const { onChange, value } = props;
  const alreadyCorrected = useFormValue(["costPriceVatCorrected"]) === true;
  const documentId = useFormValue(["_id"]) as string | undefined;
  const shippingCost = useFormValue(["shippingCost"]);
  const supplierVatRate = useFormValue(["supplierVatRate"]);
  const client = useClient({ apiVersion: "2025-01-01" });

  const vatRate =
    typeof supplierVatRate === "number"
      ? supplierVatRate / 100
      : DEFAULT_VAT_RATE;

  const addVat = useCallback(() => {
    if (typeof value !== "number" || !documentId) return;
    const corrected = +(value * (1 + vatRate)).toFixed(2);
    onChange(PatchEvent.from(set(corrected)));
    const patch = client.patch(documentId).set({ costPriceVatCorrected: true });
    // A real carriage cost gets the same VAT it would show on the supplier's
    // own invoice; Premier's shippingCost is always 0, so this is a no-op
    // for them, not a special case to branch around.
    if (typeof shippingCost === "number" && shippingCost > 0) {
      patch.set({ shippingCost: +(shippingCost * (1 + vatRate)).toFixed(2) });
    }
    patch.commit({ visibility: "async" }).catch(() => {
      // The number itself already updated via onChange either way; the
      // flag is bookkeeping for a future batch script, not something
      // Damien needs a dialog for if this one write is ever flaky.
    });
  }, [value, documentId, onChange, client, shippingCost, vatRate]);

  const label = `+${Math.round(vatRate * 100)}% VAT`;

  return (
    <Flex align="center" gap={2}>
      <div style={{ flex: 1 }}>{props.renderDefault(props)}</div>
      <Button
        mode="ghost"
        tone={alreadyCorrected ? "positive" : "primary"}
        text={alreadyCorrected ? "VAT added" : label}
        disabled={typeof value !== "number" || alreadyCorrected}
        onClick={addVat}
        title="Multiplies cost price (and shipping cost, if set) by the supplier VAT rate — non-reclaimable, since Kaiku is not VAT-registered"
      />
    </Flex>
  );
}
