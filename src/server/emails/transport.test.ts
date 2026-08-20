// @vitest-environment node
//
// Node, not the project default of jsdom: `env` is a t3-env proxy that refuses
// to hand out server-only variables when `window` exists, and jsdom defines one.
// Under jsdom every assertion here fails with "attempted to access a server-side
// environment variable on the client" rather than for any reason to do with
// email.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These exist because of a real hour lost.
 *
 * The test-send button on /admin/emails reported "Sent to you@example.com"
 * whether or not anything had left the building — `sendEmail` returned a bare
 * boolean, the caller ignored it, and the reason went only to a server log
 * nobody was reading. Damien pressed it, waited, and got nothing, with the page
 * telling him it had worked.
 *
 * So the contract worth pinning down is not "does it send" — it is **does it
 * tell the truth when it doesn't**.
 */

const ORIGINAL_ENV = { ...process.env };

async function loadTransport() {
  // Re-imported per test because `env` reads process.env at module scope.
  vi.resetModules();
  return import("./transport");
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Kaiku <orders@kaikuhome.com>";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const MAIL = {
  to: "someone@example.com",
  subject: "Test",
  html: "<p>hi</p>",
  text: "hi",
};

describe("sendEmailWithOutcome", () => {
  it("reports a real send as sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    const { sendEmailWithOutcome } = await loadTransport();
    expect(await sendEmailWithOutcome(MAIL)).toEqual({
      ok: true,
      reason: "sent",
    });
  });

  it("says nothing was sent when there is no API key", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { sendEmailWithOutcome } = await loadTransport();
    const outcome = await sendEmailWithOutcome(MAIL);

    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toBe("no-api-key");
    // The bug in one assertion: this must not claim success.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("flags an accepted send that used the onboarding sender", async () => {
    // Resend accepts it, so a boolean says "true" — but it only ever reaches the
    // account's own address, which is silent failure for a customer.
    delete process.env.RESEND_FROM_EMAIL;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );

    const { sendEmailWithOutcome } = await loadTransport();
    const outcome = await sendEmailWithOutcome(MAIL);

    expect(outcome.ok).toBe(true);
    expect(outcome.reason).toBe("no-from-address");
    expect(outcome.detail).toContain("RESEND_FROM_EMAIL");
  });

  it("passes Resend's own words back when it refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response('{"message":"The kaikuhome.com domain is not verified"}', {
          status: 403,
        }),
      ),
    );

    const { sendEmailWithOutcome } = await loadTransport();
    const outcome = await sendEmailWithOutcome(MAIL);

    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toBe("rejected");
    // The actual cause has to survive the trip, or the operator is guessing.
    expect(outcome.detail).toContain("not verified");
    expect(outcome.detail).toContain("403");
  });

  it("never puts the API key in the detail shown to an operator", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 401 })),
    );

    const { sendEmailWithOutcome } = await loadTransport();
    const outcome = await sendEmailWithOutcome(MAIL);

    expect(outcome.detail ?? "").not.toContain("re_test_key");
  });

  it("reports a network failure rather than swallowing it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    const { sendEmailWithOutcome } = await loadTransport();
    const outcome = await sendEmailWithOutcome(MAIL);

    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toBe("network-error");
    expect(outcome.detail).toContain("ECONNRESET");
  });
});

describe("sendEmail", () => {
  it("still returns a bare boolean, so the fail-soft callers are unchanged", async () => {
    // Order confirmation and the stage emails must never fail an order because
    // an email failed. Their contract does not change.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    const { sendEmail } = await loadTransport();
    expect(await sendEmail(MAIL)).toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("no", { status: 500 })),
    );
    const again = await loadTransport();
    expect(await again.sendEmail(MAIL)).toBe(false);
  });
});

describe("describeEmailConfig", () => {
  it("reports presence, never the key itself", async () => {
    const { describeEmailConfig } = await loadTransport();
    const config = describeEmailConfig();

    expect(config.canSend).toBe(true);
    expect(config.hasApiKey).toBe(true);
    expect(config.hasFromAddress).toBe(true);
    expect(JSON.stringify(config)).not.toContain("re_test_key");
  });

  it("says it cannot send with no key", async () => {
    delete process.env.RESEND_API_KEY;
    const { describeEmailConfig } = await loadTransport();
    expect(describeEmailConfig().canSend).toBe(false);
  });

  it("names the onboarding fallback when no from-address is set", async () => {
    delete process.env.RESEND_FROM_EMAIL;
    const { describeEmailConfig } = await loadTransport();
    const config = describeEmailConfig();

    expect(config.hasFromAddress).toBe(false);
    expect(config.fromAddress).toContain("resend.dev");
  });
});
