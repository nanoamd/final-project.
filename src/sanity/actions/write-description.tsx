/**
 * "Write description" — the button in the Studio.
 *
 * Damien: "can we make a button in sanity that fills what we can specific to
 * the product?"
 *
 * It sends the document id to /api/admin/write-description, which reads that
 * product's facts, has them written up, and checks the result before returning
 * it. What comes back is patched into the document the editor already has
 * open, so it lands as an ordinary unsaved edit: visible, reviewable, and
 * undoable with the Studio's own history. Nothing is published and nothing is
 * written behind Damien's back.
 *
 * The button reports what it did — how many words and sections — rather than a
 * bare "done", because the whole reason this exists is that the previous
 * approach produced pages nobody had looked at.
 */
import { useCallback, useState } from "react";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { useDocumentOperation } from "sanity";

interface WriteResponse {
  blocks?: unknown[];
  words?: number;
  sections?: number;
  error?: string;
}

/**
 * Named with a capital because it is a React component in everything but the
 * calling convention — Sanity invokes a document action like a hook, so it may
 * use hooks itself, and ESLint only knows that from the name.
 */
export const WriteDescriptionAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const { id, type, draft, published } = props;
  const { patch } = useDocumentOperation(id, type);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      // The draft is what the editor is looking at; fall back to the published
      // id for a product that has never been edited.
      const documentId = draft?._id ?? published?._id ?? id;
      const response = await fetch("/api/admin/write-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId }),
      });
      const data = (await response.json()) as WriteResponse;

      if (!response.ok || !data.blocks) {
        setFailed(true);
        setMessage(data.error ?? "Could not write a description.");
        return;
      }

      patch.execute([{ set: { description: data.blocks } }]);
      setMessage(
        `Written — ${data.words} words across ${data.sections} sections. Read it, then publish.`,
      );
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }, [draft, published, id, patch]);

  return {
    label: busy ? "Writing…" : "Write description",
    tone: failed ? "critical" : "primary",
    disabled: busy,
    onHandle: run,
    dialog: message
      ? {
          type: "dialog",
          header: failed ? "Not written" : "Description written",
          content: message,
          onClose: () => setMessage(null),
        }
      : false,
  };
};
