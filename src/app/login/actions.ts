"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildAuthCallbackUrl, getSafeNextPath, getSiteOrigin } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

async function getAuthCallbackUrl(next: string) {
  const headersList = await headers();
  const origin = getSiteOrigin({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    host: headersList.get("x-forwarded-host") || headersList.get("host"),
    forwardedProtocol: headersList.get("x-forwarded-proto"),
    isDevelopment: process.env.NODE_ENV === "development",
  });

  return buildAuthCallbackUrl(origin, next);
}

export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = getSafeNextPath(formData.get("next"));
  if (!email) redirect("/login?error=Email is required");

  const supabase = await createClient();
  const emailRedirectTo = await getAuthCallbackUrl(next);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo },
  });

  if (error) {
    console.error("Magic-link login initialization failed:", error.message);
    redirect(`/login?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  redirect(`/login?next=${encodeURIComponent(next)}&message=Check your email for your login link`);
}

export async function loginWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const next = getSafeNextPath(formData.get("next"));
  const redirectTo = await getAuthCallbackUrl(next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    console.error("Google login initialization failed:", error.message);
    redirect(`/login?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  if (data.url) redirect(data.url);
  redirect(`/login?next=${encodeURIComponent(next)}&error=auth_start_failed`);
}
