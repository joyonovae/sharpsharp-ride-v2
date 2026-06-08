"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getSiteUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = getSafeNextPath(formData.get("next"));
  if (!email) redirect("/login?error=Email is required");

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  redirect(`/login?next=${encodeURIComponent(next)}&message=Check your email for your login link`);
}

export async function loginWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const next = getSafeNextPath(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
  redirect("/login?error=Could not start Google login");
}
