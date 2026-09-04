"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { requestReturn } from "@/server/actions/returns";

/**
 * Starting a return, from the order's own page.
 *
 * The policy said "contact us with your order number and we'll guide you through
 * the next steps", which put the work on the customer at the exact moment they
 * are least pleased with you. This asks four questions and answers immediately.
 *
 * The condition questions are only asked for a change of mind. Asking someone
 * whether a broken table is "unused and in its original packaging" reads as
 * looking for a reason to say no, and the answer changes nothing: a fault is
 * covered either way.
 */

const REASONS: { value: string; label: string; hint?: string }[] = [
  {
    value: "change-of-mind",
    label: "I've changed my mind",
    hint: "Within 14 days of delivery. You arrange and pay for the return.",
  },
  {
    value: "damaged-in-transit",
    label: "It arrived damaged",
    hint: "A photo below helps enormously, and speeds up the claim.",
  },
  { value: "faulty", label: "It's faulty or has stopped working" },
  { value: "not-as-described", label: "It isn't as described" },
  { value: "wrong-item", label: "The wrong item arrived" },
];

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [photoCount, setPhotoCount] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{
    ok: boolean;
    heading: string;
    body: string;
  } | null>(null);

  const isChangeOfMind = reason === "change-of-mind";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const outcome = await requestReturn(new FormData(event.currentTarget));
      if (!outcome.ok) {
        setResult({
          ok: false,
          heading: "We couldn't start that",
          body: outcome.error ?? "Please try again.",
        });
        return;
      }
      setResult({
        ok: true,
        heading:
          outcome.decision === "decline"
            ? "We've recorded this"
            : `Return ${outcome.returnNumber}`,
        body: outcome.message ?? "We'll be in touch.",
      });
    } catch {
      setResult({
        ok: false,
        heading: "We couldn't start that",
        body: "Something went wrong at our end. Email us and we'll sort it by hand.",
      });
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="border-line bg-sand/20 mt-10 rounded-lg border p-5">
        <p className="font-display text-ink text-lg">{result.heading}</p>
        <p className="text-graphite mt-2 text-[15px] leading-relaxed">
          {result.body}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="border-line mt-10 border-t pt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-brass text-[14px] underline underline-offset-2"
        >
          Something wrong, or need to send it back?
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-line mt-10 flex flex-col gap-5 border-t pt-8"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <p className="font-display text-ink text-xl">Start a return</p>
        <p className="text-muted mt-1 text-[14px]">
          Tell us what&rsquo;s happened and we&rsquo;ll answer straight away.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-muted mb-1 text-[12px] font-medium tracking-[0.08em] uppercase">
          What&rsquo;s the reason?
        </legend>
        {REASONS.map((option) => (
          <label
            key={option.value}
            className="border-line hover:border-ink/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
          >
            <input
              type="radio"
              name="reason"
              value={option.value}
              required
              checked={reason === option.value}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1"
            />
            <span>
              <span className="text-ink block text-[14px]">{option.label}</span>
              {option.hint ? (
                <span className="text-muted mt-0.5 block text-[12.5px]">
                  {option.hint}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>

      {/* Only for a change of mind. See the note at the top of this file. */}
      {isChangeOfMind ? (
        <div className="flex flex-col gap-3">
          <YesNo
            name="unused"
            label="Is it unused?"
            hint="Handled just enough to look at it is fine."
          />
          <YesNo
            name="originalPackaging"
            label="Do you still have the original packaging?"
          />
        </div>
      ) : (
        <>
          {/* The action needs these fields present; a fault does not turn on
              them, and the answers are recorded as given. */}
          <input type="hidden" name="unused" value="yes" />
          <input type="hidden" name="originalPackaging" value="yes" />
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          {isChangeOfMind
            ? "Anything you’d like to add? (optional)"
            : "What’s wrong with it?"}
        </span>
        <textarea
          name="detail"
          rows={4}
          required={Boolean(reason) && !isChangeOfMind}
          placeholder={
            isChangeOfMind
              ? "Not required — but it helps us improve."
              : "A sentence is plenty. Which part, and what happens."
          }
          className="border-line focus:border-ink text-ink rounded-md border px-3 py-2 text-[14px] outline-none"
        />
      </label>

      {/* Fault claims only — a change of mind has nothing to photograph, and
          asking for one there reads the same way the condition questions
          would: like we're looking for a reason to say no. */}
      {!isChangeOfMind ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Photos (optional, up to 6)
          </span>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            onChange={(event) =>
              setPhotoCount(event.currentTarget.files?.length ?? 0)
            }
            className="text-graphite file:border-line file:text-ink text-[13px] file:mr-3 file:rounded-md file:border file:bg-transparent file:px-3 file:py-1.5 file:text-[13px]"
          />
          <span className="text-muted text-[12.5px]">
            {reason === "damaged-in-transit"
              ? "A transit-damage claim is much more likely to succeed with a photo attached."
              : "A photo of the fault helps us sort it faster."}
            {photoCount > 0 ? ` ${photoCount} selected.` : ""}
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !reason}>
          {pending ? "Sending…" : "Start the return"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted hover:text-ink text-[13px]"
        >
          Cancel
        </button>
      </div>

      <p className="text-muted text-[12.5px] leading-relaxed">
        Please don&rsquo;t post anything back until we&rsquo;ve sent you the
        return address and reference — every item ships from the supplier who
        holds it, and an unannounced delivery to their warehouse can be refused.
      </p>
    </form>
  );
}

function YesNo({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="text-ink text-[14px]">{label}</legend>
      {hint ? <p className="text-muted mt-0.5 text-[12.5px]">{hint}</p> : null}
      <div className="mt-2 flex gap-4">
        {[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ].map((option) => (
          <label
            key={option.value}
            className="text-graphite flex cursor-pointer items-center gap-2 text-[14px]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === "yes"}
              required
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
