import type { Metadata } from "next";

import { getEmailPreviews } from "@/server/actions/email-preview";

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
  const previews = await getEmailPreviews();

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
