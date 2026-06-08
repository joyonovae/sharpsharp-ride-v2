"use server";

import { redirect } from "next/navigation";
import { startGoogleAuth, startMagicLinkAuth } from "@/lib/auth/actions";

export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/login?error=email_required");

  const { error, next } = await startMagicLinkAuth({
    email,
    nextValue: formData.get("next"),
    mode: "login",
  });

  if (error) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  redirect(`/login?next=${encodeURIComponent(next)}&message=magic_link_sent`);
}

export async function loginWithGoogle(formData: FormData) {
  const { data, error, next } = await startGoogleAuth(
    formData.get("next"),
    "login"
  );

  if (error || !data.url) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  redirect(data.url);
}
