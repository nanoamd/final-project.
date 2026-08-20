"use client";

import * as React from "react";

import {
  type EmailPreview,
  sendTestEmail,
} from "@/server/actions/email-preview";

/**
 * The email list, the rendered preview, and a test send.
 *
 * The preview goes in an `iframe` with `srcDoc` rather than being injected into
 * this page. Email HTML is a full document of table layout and inline styles
 * built for Outlook, and dropping it into the admin page would inherit the
 * admin's own CSS — so the preview would look like neither the email nor the
 * page. The iframe gives it the isolated document it was written for, which is
 * the only way the preview is worth trusting.
 */
export function EmailPreviewer({ previews }: { previews: EmailPreview[] }) {
  const [activeStage, setActiveStage] = React.useState(previews[0]!.key);
  const [view, setView] = React.useState<"html" | "text">("html");
  const [width, setWidth] = React.useState<"desktop" | "mobile">("desktop");
  const [testTo, setTestTo] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  // Whether the last send actually worked. A failure that reads like a success
  // is the exact fault this page is here to avoid.
  const [resultOk, setResultOk] = React.useState(false);

  const active = previews.find((p) => p.key === activeStage) ?? previews[0]!;

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const outcome = await sendTestEmail(active.key, testTo);
      setResult(outcome.message);
      setResultOk(outcome.ok);
    } catch {
      setResult("Could not send — check the deploy logs.");
      setResultOk(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[250px_1fr]">
      <nav aria-label="Emails">
        <ul className="flex flex-col gap-1">
          {previews.map((preview) => {
            const isActive = preview.key === active.key;
            return (
              <li key={preview.key}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStage(preview.key);
                    setResult(null);
                    setResultOk(false);
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                    isActive
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-graphite hover:border-ink/40"
                  }`}
                >
                  <span className="block font-medium">{preview.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] ${isActive ? "text-canvas/70" : "text-muted"}`}
                  >
                    {preview.source === "studio"
                      ? "Your Studio template"
                      : "Built-in"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">
        <div className="border-line rounded-lg border p-4">
          <p className="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            Subject
          </p>
          <p className="text-ink mt-1 text-[15px] font-medium">
            {active.subject}
          </p>
          <p className="text-muted mt-2 text-[12px]">{active.when}</p>
          <p className="text-muted mt-1 text-[12px]">
            Studio template key:{" "}
            <code className="text-graphite">{active.key}</code> ·{" "}
            {active.source === "studio"
              ? "a template you wrote is live for this"
              : "no Studio template enabled, so the built-in one sends"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["html", "text"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                view === mode
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-graphite hover:border-ink/40"
              }`}
            >
              {mode === "html" ? "HTML" : "Plain text"}
            </button>
          ))}
          {view === "html" ? (
            <>
              <span className="bg-line mx-1 h-5 w-px" aria-hidden />
              {(["desktop", "mobile"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setWidth(size)}
                  aria-pressed={width === size}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    width === size
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-graphite hover:border-ink/40"
                  }`}
                >
                  {size === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </>
          ) : null}
        </div>

        {view === "html" ? (
          <div className="border-line mt-3 overflow-hidden rounded-lg border bg-white">
            <iframe
              // Keyed so switching emails remounts rather than reusing a
              // document that has already been written to.
              key={`${active.key}-${width}`}
              title={`${active.label} preview`}
              srcDoc={active.html}
              sandbox=""
              className="mx-auto block h-[720px] w-full border-0"
              style={{ maxWidth: width === "mobile" ? 390 : "100%" }}
            />
          </div>
        ) : (
          <pre className="border-line text-graphite mt-3 max-h-[720px] overflow-auto rounded-lg border p-4 text-[12.5px] leading-relaxed whitespace-pre-wrap">
            {active.text}
          </pre>
        )}

        <form
          onSubmit={handleSend}
          className="border-line mt-5 flex flex-wrap items-end gap-3 rounded-lg border p-4"
        >
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="test-to"
              className="text-muted block text-[11px] font-semibold tracking-[0.1em] uppercase"
            >
              Send a test to
            </label>
            <input
              id="test-to"
              type="email"
              required
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder="you@example.com"
              className="border-line focus:border-ink text-ink mt-1.5 w-full rounded-md border px-3 py-2 text-[14px] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-ink text-canvas hover:bg-ink/90 h-[38px] rounded-md px-4 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send test"}
          </button>
          {result ? (
            <p
              role="status"
              className={`w-full text-[13px] leading-relaxed ${
                resultOk ? "text-green-700" : "text-red-700"
              }`}
            >
              {result}
            </p>
          ) : (
            <p className="text-muted w-full text-[12px]">
              Arrives with <strong>[TEST]</strong> on the subject, using the
              sample order — never a real customer&rsquo;s details.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
