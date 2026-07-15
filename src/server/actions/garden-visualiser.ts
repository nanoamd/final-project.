"use server";

import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";

import { env } from "@/env";

const WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "gv_u";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
// Non-critical fallback — worst case a visitor without RATE_LIMIT_SECRET set
// can reset their own usage count by clearing cookies. Not a security boundary.
const FALLBACK_SECRET = "kaiku-garden-visualiser-fallback-secret";

const PRESETS: Record<string, string> = {
  sauna:
    "Add a modern cedar outdoor sauna cabin to this garden. Keep the existing layout, lighting and perspective realistic and unchanged elsewhere.",
  hotTub:
    "Add a stylish hot tub with simple deck seating to this garden. Keep the existing layout, lighting and perspective realistic and unchanged elsewhere.",
  decking:
    "Add warm timber decking, ambient lighting and simple outdoor furniture to this garden. Keep the existing layout, lighting and perspective realistic and unchanged elsewhere.",
};

export interface VisualiseGardenResult {
  ok: boolean;
  imageDataUrl?: string;
  error?: string;
}

function sign(payload: string) {
  const secret = env.RATE_LIMIT_SECRET ?? FALLBACK_SECRET;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function currentWeek() {
  return Math.floor(Date.now() / WEEK_MS);
}

async function readUsage(): Promise<number> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return 0;

  const [countStr, weekStr, sig] = raw.split(".");
  if (!countStr || !weekStr || !sig) return 0;
  if (sig !== sign(`${countStr}.${weekStr}`)) return 0;
  if (Number(weekStr) !== currentWeek()) return 0;

  return Number(countStr) || 0;
}

async function writeUsage(count: number) {
  const store = await cookies();
  const payload = `${count}.${currentWeek()}`;
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_MS / 1000,
  });
}

/**
 * Generates an AI-redesigned version of an uploaded garden photo. Usage is
 * capped per visitor via a signed, httpOnly cookie (not surfaced to the
 * user beyond a generic "try again later" message when exhausted).
 */
export async function visualiseGarden(
  imageDataUrl: string,
  presetKey: string,
): Promise<VisualiseGardenResult> {
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "This tool isn't available right now — check back soon.",
    };
  }

  const prompt = PRESETS[presetKey];
  if (!prompt) {
    return { ok: false, error: "Choose a style to try." };
  }

  const used = await readUsage();
  if (used >= WEEKLY_LIMIT) {
    return {
      ok: false,
      error:
        "You've used all your free visualisations for now — check back soon.",
    };
  }

  const match = /^data:(image\/\w+);base64,(.+)$/.exec(imageDataUrl);
  const mimeType = match?.[1];
  const base64 = match?.[2];
  if (!mimeType || !base64) {
    return { ok: false, error: "Please upload a valid photo." };
  }
  const imageBuffer = Buffer.from(base64, "base64");
  if (!imageBuffer.length || imageBuffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Please upload a photo under 8MB." };
  }

  const form = new FormData();
  form.append("model", "gpt-image-1-mini");
  form.append(
    "image",
    new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
    "garden",
  );
  form.append("prompt", prompt);
  form.append("size", "1024x1024");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "Something went wrong generating your image. Please try again.",
    };
  }

  const data = (await response.json()) as { data?: { b64_json?: string }[] };
  const resultBase64 = data.data?.[0]?.b64_json;
  if (!resultBase64) {
    return {
      ok: false,
      error: "Something went wrong generating your image. Please try again.",
    };
  }

  await writeUsage(used + 1);

  return { ok: true, imageDataUrl: `data:image/png;base64,${resultBase64}` };
}
