"use server";

import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface CustomerAuthResult {
  ok: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
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
    return { ok: false, error: error.message };
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
