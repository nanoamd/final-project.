"use server";

import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface CustomerAuthResult {
  ok: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

/**
 * Supabase's raw auth error messages are meant for logs, not customers (e.g.
 * "email rate limit exceeded") — map the ones we can realistically hit to
 * copy that tells the customer what to actually do.
 */
function friendlySignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) {
    return "We're experiencing high signup traffic right now — please try again in a few minutes.";
  }
  if (
    lower.includes("already registered") ||
    lower.includes("already exists")
  ) {
    return "An account with that email already exists — try signing in instead.";
  }
  if (lower.includes("password")) {
    return "Please choose a password with at least 8 characters.";
  }
  if (lower.includes("email")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong creating your account. Please try again.";
}

export async function signUpCustomer(
  formData: FormData,
): Promise<CustomerAuthResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("fullName");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    password.length < 8
  ) {
    return {
      ok: false,
      error:
        "Please enter a valid email and a password of at least 8 characters.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: typeof fullName === "string" ? fullName.trim() : undefined,
      },
    },
  });

  if (error) {
    return { ok: false, error: friendlySignupError(error.message) };
  }
  if (!data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }
  return { ok: true };
}

export async function signInCustomer(
  formData: FormData,
): Promise<CustomerAuthResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return { ok: false, error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }
  return { ok: true };
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account");
}
