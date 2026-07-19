"use server";

import "server-only";

import { redirect } from "next/navigation";

import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";

export interface AdminSignInResult {
  ok: boolean;
  error?: string;
}

/**
 * Signs in against the single Supabase account allowed into /admin. Checks
 * the submitted email against ADMIN_EMAIL before even attempting Supabase
 * auth — there's no self-signup, so any other account is out of scope
 * regardless of whether it happens to authenticate.
 */
export async function signInAdmin(
  formData: FormData,
): Promise<AdminSignInResult> {
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

  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { ok: false, error: "Admin login isn't configured yet." };
  }
  if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
    return { ok: false, error: "Invalid email or password." };
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

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
