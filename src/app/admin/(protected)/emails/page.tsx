import type { Metadata } from "next";

import {
  getEmailConfigStatus,
  getEmailPreviews,
} from "@/server/actions/email-preview";

import { EmailPreviewer } from "./email-previewer";

export const metadata: Metadata = {
  title: "Emails",
  robots: { index: false, follow: false },
};

/**
 * Preview and test-send every transactional email without placing an order.
 *
 * Before this, the only way to see a dispatch email was to take a real payment
 * and walk an order through its stages — which meant the emails were, in
 * practice, untested. Everything here is rendered by `resolveStageEmail`, the
 * same resolver the live sender calls, so a preview cannot flatter itself.
 */
export default async function AdminEmailsPage() {
  const [previews, config] = await Promise.all([
    getEmailPreviews(),
    getEmailConfigStatus(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-ink text-3xl tracking-tight">Emails</h1>
      <p className="text-graphite mt-2 max-w-prose text-[15px]">
        Every email a customer can receive, rendered against a sample sauna
        order. These are produced by the same code that sends the real thing —
        if a Studio template is live for one, this shows the Studio version.
      </p>
      <p className="text-muted mt-2 max-w-prose text-[13px]">
        A browser preview cannot tell you whether Outlook broke the layout or a
        client blocked the images. Send yourself a test for anything you are
        about to rely on.
      </p>

      {/* Said up front, because otherwise the only way to discover email is
          switched off is to send a test and wait for something that was never
          coming. */}
      {config && !config.canSend ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-[14px] font-semibold text-red-800">
            This deployment cannot send email.
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-red-900">
            <code>RESEND_API_KEY</code> is not set, so every email below is
            dropped silently — order confirmations included. Add it in Vercel
            under Settings → Environment Variables (Production), then{" "}
            <strong>redeploy</strong>: a new variable only takes effect on a
            fresh build.
          </p>
        </div>
      ) : null}

      {config?.canSend && !config.hasFromAddress ? (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-[14px] font-semibold text-amber-900">
            Sending as Resend&rsquo;s onboarding address.
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-amber-900">
            <code>RESEND_FROM_EMAIL</code> is not set, so mail goes out as{" "}
            <code>{config.fromAddress}</code>. That sender only delivers to your
            own Resend account address — anything to a customer is dropped. Set
            it to an address on a domain you have verified in Resend.
          </p>
        </div>
      ) : null}

      {config?.canSend && config.hasFromAddress ? (
        <p className="text-muted mt-6 text-[13px]">
          Sending as <code className="text-graphite">{config.fromAddress}</code>
          .
        </p>
      ) : null}

      {previews.length === 0 ? (
        <p className="border-line text-graphite mt-8 rounded-lg border p-6 text-[14px]">
          No previews available — you may need to sign in again.
        </p>
      ) : (
        <EmailPreviewer previews={previews} />
      )}
    </div>
  );
}
