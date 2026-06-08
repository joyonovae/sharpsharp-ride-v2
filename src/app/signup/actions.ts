"use server";

import { redirect } from "next/navigation";
import { startGoogleAuth, startMagicLinkAuth } from "@/lib/auth/actions";

export async function signupWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/signup?error=email_required");

  const { error, next } = await startMagicLinkAuth({
    email,
    nextValue: formData.get("next"),
    mode: "signup",
  });

  if (error) {
    redirect(`/signup?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  redirect(`/signup?next=${encodeURIComponent(next)}&message=magic_link_sent`);
}

export async function signupWithGoogle(formData: FormData) {
  const { data, error, next } = await startGoogleAuth(
    formData.get("next"),
    "signup"
  );

  if (error || !data.url) {
    redirect(`/signup?next=${encodeURIComponent(next)}&error=auth_start_failed`);
  }

  redirect(data.url);
}
