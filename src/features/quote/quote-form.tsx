"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  formatBytes,
  MAX_ATTACHMENT_TOTAL_BYTES,
  MAX_ATTACHMENTS,
  validateAttachments,
} from "@/features/quote/attachments";
import {
  BUDGET_GUIDES,
  POWER_SUPPLY,
  PROJECT_TYPES,
  SITE_READINESS,
  SITED_PROJECT_TYPES,
  TIMESCALES,
} from "@/features/quote/options";
import {
  type QuoteFieldName,
  submitQuoteRequest,
} from "@/server/actions/quote";

const label = "text-muted text-[12px] font-medium tracking-[0.08em] uppercase";
const fieldset = "border-line border-t pt-8";
const legend = "font-display text-ink text-lg tracking-tight";

/**
 * The quote request form.
 *
 * Structured as four numbered fieldsets rather than one long column of inputs.
 * A quotation form is a longer commitment than a contact form, and the thing that
 * makes people abandon one is not its length but not knowing how much is left —
 * so the sections are counted, and only the ones that apply are shown.
 *
 * Follows the pattern already used by ContactForm: plain state and a direct call
 * to the server action. Consistency with the one working form in the codebase is
 * worth more here than a newer hook.
 */
export function QuoteForm() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<QuoteFieldName, string>>
  >({});
  const [reference, setReference] = React.useState<string | null>(null);
  const [attachmentProblem, setAttachmentProblem] = React.useState<
    string | null
  >(null);

  /**
   * Which project types are selected, tracked only so the two site questions can
   * appear when they are relevant. Asking about groundworks and power on an order
   * for a £179 bedside table is the sort of thing that makes a form feel like it
   * was written for somebody else.
   */
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const needsSiteQuestions = selectedTypes.some((type) =>
    SITED_PROJECT_TYPES.has(type),
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      const result = await submitQuoteRequest(
        new FormData(event.currentTarget),
      );
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setReference(result.reference ?? null);
    } catch {
      setError(
        "Something went wrong sending your request. Please email us instead and we'll reply today.",
      );
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <div className="border-line bg-paper border p-8">
        <p className="text-ink font-display text-2xl tracking-tight">
          Request received
        </p>
        <p className="text-graphite mt-3 text-[15px] leading-relaxed">
          Your reference is{" "}
          <span className="text-ink font-medium">{reference}</span>. Quote it in
          any reply and we will know exactly which enquiry you mean.
        </p>
        <p className="text-graphite mt-4 text-[15px] leading-relaxed">
          We read every request ourselves rather than passing it to a call
          centre, so a considered reply takes a little longer than an automated
          one. If anything is urgent, email us and say so.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
      {/* Honeypot. Hidden from sight and from assistive technology, and its
          presence only flags the submission rather than discarding it — a browser
          that autofills it would otherwise bin a real enquiry silently. */}
      <div aria-hidden className="hidden">
        <label htmlFor="_hp">Leave this empty</label>
        <input
          id="_hp"
          type="text"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset className={fieldset}>
        <legend className={legend}>1. What are you planning?</legend>
        <p className="text-muted mt-2 text-[14px] leading-relaxed">
          Choose everything that applies. It decides which of our suppliers we
          price it with.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {PROJECT_TYPES.map((option) => (
            <label
              key={option.value}
              className="border-line hover:border-ink/40 has-checked:border-brass has-checked:bg-brass/[0.04] flex cursor-pointer items-start gap-3 border p-3 transition-colors"
            >
              <input
                type="checkbox"
                name="projectType"
                value={option.value}
                className="accent-brass mt-0.5 size-4 shrink-0"
                onChange={(event) =>
                  setSelectedTypes((previous) =>
                    event.currentTarget.checked
                      ? [...previous, option.value]
                      : previous.filter((value) => value !== option.value),
                  )
                }
              />
              <span>
                <span className="text-ink block text-[14px] font-medium">
                  {option.label}
                </span>
                {option.detail ? (
                  <span className="text-muted mt-0.5 block text-[12px] leading-snug">
                    {option.detail}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.projectType} />
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>2. The space</legend>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>
              Products you have in mind{" "}
              <span className="normal-case">(optional)</span>
            </span>
            <Input
              type="text"
              name="products"
              placeholder="Names or links, if you already know"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={label}>
                Postcode <span className="normal-case">(optional)</span>
              </span>
              <Input
                type="text"
                name="postcode"
                autoComplete="postal-code"
                placeholder="SL8 5NF"
              />
              <span className="text-muted text-[12px]">
                Delivery and access are priced from this.
              </span>
            </label>
            <Choice name="timescale" title="Timescale" options={TIMESCALES} />
          </div>
          <Choice
            name="budget"
            title="Budget guide"
            options={BUDGET_GUIDES}
            hint="Only so we quote at the right level. Nothing is held against it."
          />
          {needsSiteQuestions ? (
            <div className="border-line bg-paper grid gap-4 border p-4 sm:grid-cols-2">
              <Choice
                name="siteReadiness"
                title="Site readiness"
                options={SITE_READINESS}
              />
              <Choice
                name="powerSupply"
                title="Power supply"
                options={POWER_SUPPLY}
              />
            </div>
          ) : null}
        </div>
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>3. Tell us about it</legend>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>What are you trying to achieve?</span>
            <textarea
              name="requirements"
              rows={7}
              className="border-line focus:border-ink bg-canvas text-ink placeholder:text-muted/70 w-full border px-3 py-2.5 text-[15px] leading-relaxed transition-colors outline-none"
              placeholder="The space, how you want to use it, anything we should know about access."
            />
            <span className="text-muted text-[12px]">
              A couple of sentences is plenty to start.
            </span>
          </label>
          <FieldError message={fieldErrors.requirements} />

          <label className="flex flex-col gap-1.5">
            <span className={label}>
              Photographs or plans{" "}
              <span className="normal-case">(optional)</span>
            </span>
            <input
              type="file"
              name="attachments"
              multiple
              accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
              className="text-graphite border-line file:border-line file:bg-paper file:text-ink w-full border px-3 py-2.5 text-[14px] file:mr-3 file:border file:px-3 file:py-1.5 file:text-[13px]"
              onChange={(event) =>
                setAttachmentProblem(
                  validateAttachments(
                    Array.from(event.currentTarget.files ?? []),
                  ),
                )
              }
            />
            <span className="text-muted text-[12px]">
              Up to {MAX_ATTACHMENTS} files,{" "}
              {formatBytes(MAX_ATTACHMENT_TOTAL_BYTES)} in total. A photo of the
              spot tells us more than a paragraph.
            </span>
            {/* Checked in the browser as well as on the server. The server is
                still the authority — it records anything it rejects rather than
                dropping it — but finding out here saves a round trip. */}
            <FieldError message={attachmentProblem ?? undefined} />
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>4. How we reach you</legend>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name</span>
            <Input type="text" name="name" autoComplete="name" />
            <FieldError message={fieldErrors.name} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Email</span>
            <Input type="email" name="email" autoComplete="email" />
            <FieldError message={fieldErrors.email} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>
              Phone <span className="normal-case">(optional)</span>
            </span>
            <Input type="tel" name="phone" autoComplete="tel" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>
              Company <span className="normal-case">(optional)</span>
            </span>
            <Input type="text" name="company" autoComplete="organization" />
          </label>
        </div>
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="border-line bg-paper text-ink border p-4 text-[14px]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="rounded-none">
          {pending ? "Sending…" : "Send request"}
        </Button>
        <p className="text-muted text-[12px] leading-relaxed">
          We use this to prepare your quotation and nothing else. No newsletter
          unless you ask for one.
        </p>
      </div>
    </form>
  );
}

function Choice({
  name,
  title,
  options,
  hint,
}: {
  name: string;
  title: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={label}>
        {title} <span className="normal-case">(optional)</span>
      </span>
      <select
        name={name}
        defaultValue=""
        className="border-line focus:border-ink bg-canvas text-ink w-full border px-3 py-2.5 text-[15px] transition-colors outline-none"
      >
        <option value="">No preference</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-muted text-[12px]">{hint}</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-[13px] text-red-700">
      {message}
    </span>
  );
}
