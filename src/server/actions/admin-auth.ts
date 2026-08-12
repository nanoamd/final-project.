"use server";

import "server-only";

import { redirect } from "next/navigation";

import { siteUrl } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdminEmail } from "@/server/auth/admin";

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

  if (!(await isAuthorizedAdminEmail(email))) {
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

export interface AdminPasswordResetResult {
  ok: boolean;
  error?: string;
}

/**
 * Always returns `{ ok: true }` regardless of whether the submitted email is
 * an authorized admin — an error here would confirm/deny an admin account's
 * email address to whoever's asking. The reset email only actually gets
 * sent when it is one.
 */
export async function requestAdminPasswordReset(
  formData: FormData,
): Promise<AdminPasswordResetResult> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "Please enter your email." };
  }

  if (await isAuthorizedAdminEmail(email)) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/admin/reset-password`,
    });
  }
  return { ok: true };
}

/**
 * Sets a new password using the recovery session established by the
 * `/admin/reset-password` route handler after the emailed link's code is
 * exchanged. Re-checks the session belongs to an authorized admin account —
 * the route handler already gates indirectly (only an authorized address
 * ever gets a reset email sent), but this is the actual authorization
 * boundary before a password can be changed.
 */
export async function updateAdminPassword(
  formData: FormData,
): Promise<AdminPasswordResetResult> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return {
      ok: false,
      error: "Password must be at least 8 characters.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !(await isAuthorizedAdminEmail(user.email))) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
