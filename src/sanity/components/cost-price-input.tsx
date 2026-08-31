import { Button, Flex } from "@sanity/ui";
import { useCallback } from "react";
import { type NumberInputProps, PatchEvent, set, useFormValue } from "sanity";

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
 * `costPriceVatCorrected` is set in the same patch as the new cost price,
 * so a click here is one undoable, reviewable pending edit like any other
 * field change — nothing commits until Damien publishes — and the flag
 * means a later batch run of `fix-premier-housewares-margins.ts` can never
 * multiply this cost by 1.2 a second time.
 */
export function CostPriceInput(props: NumberInputProps) {
  const { onChange, value } = props;
  const alreadyCorrected = useFormValue(["costPriceVatCorrected"]) === true;

  const addVat = useCallback(() => {
    if (typeof value !== "number") return;
    const corrected = +(value * (1 + VAT_RATE)).toFixed(2);
    onChange(
      PatchEvent.from([set(corrected), set(true, ["costPriceVatCorrected"])]),
    );
  }, [value, onChange]);

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
