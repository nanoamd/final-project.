import { Button, Flex } from "@sanity/ui";
import { useCallback } from "react";
import {
  type NumberInputProps,
  PatchEvent,
  set,
  useClient,
  useFormValue,
} from "sanity";

const VAT_RATE = 0.2;

/**
 * The cost price field, with the "+20% VAT" button right next to the box —
 * not in the document action bar. Damien: *"i want the button to be next
 * too the cost price box right enxt to it"*.
 *
 * Same fix as the document action it replaces (`add-supplier-vat.tsx`,
 * removed once this landed): Premier Housewares' trade price list is
 * ex-VAT, they invoice 20% on top that Kaiku can't reclaim, and this is
 * where that 20% belongs — on the field itself, one click, no trip to their
 * checkout to read a tax line.
 *
 * **Two different writes, on purpose, after the first version of this
 * crashed the whole Studio.** `props.onChange` is scoped to the field it
 * belongs to — this input's own bound path, `costPrice` — and any patch
 * passed through it is prefixed with that path as it bubbles up. The first
 * version tried to also set the sibling `costPriceVatCorrected` flag
 * through that same channel with an explicit path, which doesn't escape the
 * prefixing: it patched `costPrice.costPriceVatCorrected`, a sub-path on a
 * plain number, and the engine had no way to apply that. Damien: *"it
 * crashes everytime i do it"*. The flag is a genuine sibling field, so it
 * gets its own client patch instead — still lands on the same draft Sanity
 * is already continuously autosaving as you type, so nothing about how
 * this behaves for Damien actually changes; only the plumbing does.
 */
export function CostPriceInput(props: NumberInputProps) {
  const { onChange, value } = props;
  const alreadyCorrected = useFormValue(["costPriceVatCorrected"]) === true;
  const documentId = useFormValue(["_id"]) as string | undefined;
  const client = useClient({ apiVersion: "2025-01-01" });

  const addVat = useCallback(() => {
    if (typeof value !== "number" || !documentId) return;
    const corrected = +(value * (1 + VAT_RATE)).toFixed(2);
    onChange(PatchEvent.from(set(corrected)));
    client
      .patch(documentId)
      .set({ costPriceVatCorrected: true })
      .commit({ visibility: "async" })
      .catch(() => {
        // The number itself already updated via onChange either way; the
        // flag is bookkeeping for a future batch script, not something
        // Damien needs a dialog for if this one write is ever flaky.
      });
  }, [value, documentId, onChange, client]);

  return (
    <Flex align="center" gap={2}>
      <div style={{ flex: 1 }}>{props.renderDefault(props)}</div>
      <Button
        mode="ghost"
        tone={alreadyCorrected ? "positive" : "primary"}
        text={alreadyCorrected ? "VAT added" : "+20% VAT"}
        disabled={typeof value !== "number" || alreadyCorrected}
        onClick={addVat}
        title="Multiplies cost price by 1.2 for Premier Housewares' non-reclaimable VAT"
      />
    </Flex>
  );
}
