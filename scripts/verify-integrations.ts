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

const shape = (v: string | undefined) =>
  v ? `set (${v.length} chars)` : "NOT SET";

/* ------------------------------------------------------------------ sanity -- */

async function checkSanity() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
  const valid = /^[a-z0-9-]{1,24}$/.test(projectId ?? "");

  add(
    "Sanity",
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    valid ? "ok" : "fail",
    valid
      ? projectId!
      : `${shape(projectId)} — not a project ID. A token pasted here is what took the site down; the code falls back to huh1e45n but do not rely on that.`,
  );

  // A tokenless read is exactly what the public site does.
  const id = valid ? projectId! : "huh1e45n";
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
  if (!token) {
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
    !k
      ? "NOT SET"
      : k.includes("_live_")
        ? "LIVE"
        : k.includes("_test_")
          ? "TEST"
          : "unrecognised";

  add(
    "Stripe",
    "STRIPE_SECRET_KEY",
    secret ? (mode(secret) === "LIVE" ? "ok" : "warn") : "fail",
    mode(secret) === "TEST"
      ? "TEST mode — no real money can be taken"
      : mode(secret),
  );
  add(
    "Stripe",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    pub ? (mode(pub) === "LIVE" ? "ok" : "warn") : "fail",
    mode(pub),
  );
  add(
    "Stripe",
    "STRIPE_WEBHOOK_SECRET",
    hook ? "ok" : "fail",
    hook
      ? shape(hook)
      : "NOT SET — payments will succeed and no order will be recorded",
  );
  if (secret && pub && mode(secret) !== mode(pub)) {
    add(
      "Stripe",
      "key modes match",
      "fail",
      `secret is ${mode(secret)} but publishable is ${mode(pub)}`,
    );
  }
}

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
