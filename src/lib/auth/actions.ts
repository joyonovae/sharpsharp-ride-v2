import "server-only";

import { headers } from "next/headers";
import { buildAuthCallbackUrl, getSafeNextPath, getSiteOrigin } from "./redirects";
import { createClient } from "@/lib/supabase/server";

type AuthMode = "login" | "signup";

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

export async function startMagicLinkAuth({
  email,
  nextValue,
  mode,
}: {
  email: string;
  nextValue: unknown;
  mode: AuthMode;
}) {
  const next = getSafeNextPath(nextValue);
  const emailRedirectTo = await getAuthCallbackUrl(next);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "signup",
      emailRedirectTo,
    },
  });

  if (error) {
    console.error(`Magic-link ${mode} initialization failed:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      emailRedirectTo,
    });
  }

  return { error, next };
}

export async function startGoogleAuth(nextValue: unknown, mode: AuthMode) {
  const next = getSafeNextPath(nextValue);
  const redirectTo = await getAuthCallbackUrl(next);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    console.error(`Google ${mode} initialization failed:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      redirectTo,
    });
  }

  return { data, error, next };
}
