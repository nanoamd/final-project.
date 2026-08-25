/**
 * Integration health check — answers "is this actually configured?" for the
 * services a sale depends on, rather than leaving it to be discovered by a
 * customer paying and hearing nothing.
 *
 * Every gate this checks fails *silently* in production by design, so that a
 * misconfiguration never turns a visitor's successful action into an error.
 * That is the right runtime behaviour and a terrible way to find out: five
 * contact submissions sat unread for weeks because nothing said the
 * notification had been skipped.
 *
 * Never prints a secret. Reports presence, shape and mode only — length, live
 * vs test, verified vs pending.
 *
 * Run against production values, not your laptop's:
 *   vercel env pull .env.production.local
 *   pnpm tsx --env-file=.env.production.local scripts/verify-integrations.ts
 *
 * Add --send-test to send one real email to ADMIN_EMAIL. That is the only way
 * to prove delivery end to end; the API key being valid does not prove a
 * message arrives.
 */
const sendTest = process.argv.includes("--send-test");

type Status = "ok" | "warn" | "fail";
const rows: { area: string; check: string; status: Status; detail: string }[] =
  [];
const add = (area: string, check: string, status: Status, detail: string) =>
  rows.push({ area, check, status, detail });

/**
 * `vercel env pull` writes the literal string "[SENSITIVE]" in place of any
 * variable marked sensitive in the dashboard, so the real value never reaches
 * this machine. Reporting that as a malformed project ID or an unrecognised
 * Stripe key is worse than useless — it sends you hunting a bug that is not
 * there. Detect it and say plainly that the value exists but cannot be checked
 * from here.
 */
const REDACTED = "[SENSITIVE]";
const isRedacted = (v: string | undefined) => v?.trim() === REDACTED;

const shape = (v: string | undefined) =>
  isRedacted(v)
    ? "set, redacted by Vercel"
    : v
      ? `set (${v.length} chars)`
      : "NOT SET";

/* ------------------------------------------------------------------ sanity -- */

async function checkSanity() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
  const redacted = isRedacted(projectId);
  const valid = /^[a-z0-9-]{1,24}$/.test(projectId ?? "") && !redacted;

  add(
    "Sanity",
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    redacted ? "warn" : valid ? "ok" : "fail",
    redacted
      ? "set, redacted by Vercel — check it reads huh1e45n in the dashboard"
      : valid
        ? projectId!
        : `${shape(projectId)} — not a project ID. A token pasted here is what took the site down; the code falls back to huh1e45n but do not rely on that.`,
  );

  // A tokenless read is exactly what the public site does. With a redacted ID
  // there is nothing to test but the fallback, so say which one is being used.
  const id = valid ? projectId! : "huh1e45n";
  if (redacted) {
    add(
      "Sanity",
      "public read",
      "warn",
      `cannot verify the configured ID from here — testing the fallback (${id}) instead`,
    );
  }
  try {
    const res = await fetch(
      `https://${id}.apicdn.sanity.io/v2025-01-01/data/query/${dataset}?query=${encodeURIComponent('count(*[_type=="product"])')}`,
    );
    const body = (await res.json()) as { result?: number; error?: string };
    add(
      "Sanity",
      "public read (what visitors get)",
      res.ok && typeof body.result === "number" ? "ok" : "fail",
      res.ok ? `${body.result} published products` : `HTTP ${res.status}`,
    );
  } catch (err) {
    add("Sanity", "public read", "fail", (err as Error).message);
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (isRedacted(token)) {
    add("Sanity", "write token", "warn", shape(token));
  } else if (!token) {
    add("Sanity", "write token", "warn", "NOT SET — imports will not run");
  } else {
    const res = await fetch(
      `https://${id}.api.sanity.io/v2025-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mutations: [] }),
      },
    );
    add(
      "Sanity",
      "write token",
      res.ok ? "ok" : "fail",
      res.ok ? "accepted (empty mutation)" : `HTTP ${res.status}`,
    );
  }
}

/* ------------------------------------------------------------------ resend -- */

async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const admin = process.env.ADMIN_EMAIL;

  add(
    "Email",
    "ADMIN_EMAIL",
    admin ? "ok" : "fail",
    admin
      ? admin
      : "NOT SET — contact enquiries notify nobody, and /admin is unreachable",
  );

  if (!key) {
    add(
      "Email",
      "RESEND_API_KEY",
      "fail",
      "NOT SET — no email is sent by this deployment at all",
    );
    return;
  }
  add("Email", "RESEND_API_KEY", "ok", shape(key));

  // Domains endpoint doubles as a key check and a verification-status check.
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    add(
      "Email",
      "Resend API key valid",
      "fail",
      `HTTP ${res.status} — key rejected`,
    );
    return;
  }
  const body = (await res.json()) as {
    data?: { name: string; status: string }[];
  };
  const domains = body.data ?? [];
  add(
    "Email",
    "Resend API key valid",
    "ok",
    `${domains.length} domain(s) on the account`,
  );

  for (const d of domains) {
    add(
      "Email",
      `domain ${d.name}`,
      d.status === "verified" ? "ok" : "warn",
      d.status,
    );
  }

  if (!from) {
    add(
      "Email",
      "RESEND_FROM_EMAIL",
      "fail",
      "NOT SET — falls back to onboarding@resend.dev, which only delivers to " +
        "the Resend account's own address. Customers get nothing.",
    );
  } else {
    const domain = from.split("@").pop()?.replace(/>$/, "").trim() ?? "";
    const match = domains.find((d) => domain.endsWith(d.name));
    add(
      "Email",
      "RESEND_FROM_EMAIL",
      match?.status === "verified" ? "ok" : "fail",
      match
        ? `${from} — domain ${match.name} is ${match.status}`
        : `${from} — domain "${domain}" is not on this Resend account, so sends will be rejected`,
    );
  }

  if (sendTest && admin && from) {
    const res2 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: admin,
        subject: "Kaiku — integration test",
        html: "<p>If you are reading this, transactional email works. Contact enquiries and order confirmations will reach you.</p>",
      }),
    });
    const out = (await res2.json()) as { id?: string; message?: string };
    add(
      "Email",
      "test send",
      res2.ok ? "ok" : "fail",
      res2.ok ? `queued (id ${out.id}) — check ${admin}` : (out.message ?? ""),
    );
  } else if (sendTest) {
    add(
      "Email",
      "test send",
      "warn",
      "skipped — needs both ADMIN_EMAIL and RESEND_FROM_EMAIL",
    );
  }
}

/* ------------------------------------------------------------------ stripe -- */

function checkStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const hook = process.env.STRIPE_WEBHOOK_SECRET;

  const mode = (k?: string) =>
    isRedacted(k)
      ? "REDACTED"
      : !k
        ? "NOT SET"
        : k.includes("_live_")
          ? "LIVE"
          : k.includes("_test_")
            ? "TEST"
            : "unrecognised";

  // A redacted key cannot be graded live vs test from here, so warn rather than
  // pass or fail — the one thing worse than not knowing is being told wrongly.
  const grade = (k?: string): Status =>
    isRedacted(k) ? "warn" : !k ? "fail" : mode(k) === "LIVE" ? "ok" : "warn";

  add(
    "Stripe",
    "STRIPE_SECRET_KEY",
    grade(secret),
    isRedacted(secret)
      ? "set, redacted by Vercel — reveal it in the dashboard and check it starts sk_live_"
      : mode(secret) === "TEST"
        ? "TEST mode — no real money can be taken"
        : mode(secret),
  );
  add(
    "Stripe",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    grade(pub),
    isRedacted(pub) ? "set, redacted by Vercel" : mode(pub),
  );
  add(
    "Stripe",
    "STRIPE_WEBHOOK_SECRET",
    hook ? "ok" : "fail",
    hook
      ? shape(hook)
      : "NOT SET — payments will succeed and no order will be recorded",
  );
  if (
    secret &&
    pub &&
    !isRedacted(secret) &&
    !isRedacted(pub) &&
    mode(secret) !== mode(pub)
  ) {
    add(
      "Stripe",
      "key modes match",
      "fail",
      `secret is ${mode(secret)} but publishable is ${mode(pub)}`,
    );
  }
}

// This file imports nothing, which leaves it in the global scope where its `main`
// can collide with any other non-module script — `tsc --noEmit` was reporting
// TS2393 here. An empty export makes it a module and gives it its own scope.
export {};

/* -------------------------------------------------------------------- main -- */

async function main() {
  await checkSanity();
  await checkResend();
  checkStripe();

  const icon = { ok: "PASS", warn: "WARN", fail: "FAIL" } as const;
  let area = "";
  console.log("");
  for (const r of rows) {
    if (r.area !== area) {
      area = r.area;
      console.log(`${area}`);
    }
    console.log(
      `  [${icon[r.status]}] ${r.check.padEnd(34)} ${r.detail}`.trimEnd(),
    );
  }

  const fails = rows.filter((r) => r.status === "fail").length;
  const warns = rows.filter((r) => r.status === "warn").length;
  console.log(
    `\n${rows.length - fails - warns} passed, ${warns} warning(s), ${fails} failure(s).`,
  );
  if (rows.some((r) => r.detail.includes("redacted"))) {
    console.log(
      'Some values came back as "[SENSITIVE]" — Vercel withholds variables marked\n' +
        "sensitive, so they cannot be checked from here. They ARE set; reveal them in\n" +
        "the dashboard to confirm their contents.",
    );
  }
  if (fails) {
    console.log(
      "A failure above means that capability is not working in this environment.\n",
    );
    process.exitCode = 1;
  } else {
    console.log(
      "No failures. Run one real test purchase before sending traffic — that is\n" +
        "the only check that proves payment, webhook, order row and email together.\n",
    );
  }
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
