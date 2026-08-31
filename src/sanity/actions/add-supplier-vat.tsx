/**
 * "Add supplier VAT" — the button in the Studio, next to the description one.
 *
 * Damien: "adding the product to basket and reaching checkout to see how
 * much vat we need to add takes too long to publish products". Premier
 * Housewares' trade price list is ex-VAT; they invoice 20% on top of it, and
 * Kaiku can't reclaim that (not VAT-registered) — so it belongs in
 * `costPrice`, the field this site treats as the true landed cost. Before
 * this button, finding that number meant putting the item in the supplier's
 * basket and going to their checkout just to read the tax line.
 *
 * One click: multiplies `costPrice` by 1.2 and sets `costPriceVatCorrected`
 * so this can never fire twice on the same document — the exact bug a
 * second run of `fix-premier-housewares-margins.ts` would otherwise hit
 * (multiplying an already-corrected cost by 1.2 again). Patches the open
 * document like an ordinary unsaved edit, same as "Write description" —
 * visible, reviewable, undoable, nothing published behind Damien's back.
 */
import { useCallback, useState } from "react";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { useDocumentOperation } from "sanity";

const VAT_RATE = 0.2;

export const AddSupplierVatAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const { id, type, draft, published } = props;
  const { patch } = useDocumentOperation(id, type);
  const [message, setMessage] = useState<string | null>(null);

  const current = (draft ?? published) as
    { costPrice?: number; costPriceVatCorrected?: boolean } | undefined;
  const costPrice = current?.costPrice;
  const alreadyCorrected = current?.costPriceVatCorrected === true;

  const run = useCallback(() => {
    if (typeof costPrice !== "number") return;
    const corrected = +(costPrice * (1 + VAT_RATE)).toFixed(2);
    patch.execute([
      { set: { costPrice: corrected, costPriceVatCorrected: true } },
    ]);
    setMessage(
      `Cost price £${costPrice.toFixed(2)} → £${corrected.toFixed(2)} (+${VAT_RATE * 100}% VAT). Read it, then publish.`,
    );
  }, [costPrice, patch]);

  if (typeof costPrice !== "number") return null;

  return {
    label: alreadyCorrected
      ? "Supplier VAT already added"
      : "Add supplier VAT (20%)",
    tone: "primary",
    disabled: alreadyCorrected,
    onHandle: run,
    dialog: message
      ? {
          type: "dialog",
          header: "Cost price updated",
          content: message,
          onClose: () => setMessage(null),
        }
      : false,
  };
};
