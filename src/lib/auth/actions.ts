import "server-only";

import { headers } from "next/headers";
import { buildAuthCallbackUrl, getSafeNextPath, getSiteOrigin } from "./redirects";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type AuthMode = "login" | "signup";
type AuthStartFailure = {
  message: string;
  status?: number;
  code?: string;
};

async function getAuthCallbackUrl(next: string) {
  const headersList = await headers();
  const requestHost =
    headersList.get("x-forwarded-host") || headersList.get("host");
  const requestProtocol = headersList.get("x-forwarded-proto");
  const origin = getSiteOrigin({
    configuredSiteUrl:
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_SITE_URL
        : undefined,
    host: requestHost,
    forwardedProtocol: requestProtocol,
    isDevelopment: process.env.NODE_ENV === "development",
    preserveRequestHost: true,
  });

  const callbackUrl = buildAuthCallbackUrl(origin, next);

  console.info("Auth callback URL generated:", {
    origin,
    callbackUrl,
    next,
    configuredSiteUrlPresent: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    requestHost,
  });

  return callbackUrl;
}

function logAuthEnvironment(mode: AuthMode, method: "google" | "magic-link") {
  try {
    const config = getSupabasePublicConfig();
    console.info(`${method} ${mode} environment status:`, {
      siteUrlPresent: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
      supabaseUrlPresent: Boolean(config.url),
      supabaseHost: new URL(config.url).hostname,
      supabaseKeySource: config.keySource,
      supabaseKeyPresent: Boolean(config.key),
    });
  } catch (error) {
    console.error(`${method} ${mode} environment validation failed:`, {
      message: error instanceof Error ? error.message : String(error),
      siteUrlPresent: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
      supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      anonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      publishableKeyPresent: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
      ),
    });
  }
}

function getAuthStartFailure(error: unknown): AuthStartFailure {
  if (error && typeof error === "object") {
    const authError = error as {
      message?: unknown;
      status?: unknown;
      code?: unknown;
    };
    return {
      message: String(authError.message || "Authentication initialization failed."),
      status:
        typeof authError.status === "number" ? authError.status : undefined,
      code: authError.code ? String(authError.code) : undefined,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : "Authentication initialization failed.",
  };
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
  logAuthEnvironment(mode, "magic-link");

  try {
    const emailRedirectTo = await getAuthCallbackUrl(next);
    const supabase = await createClient();

    console.info(`Starting magic-link ${mode}:`, { emailRedirectTo });
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
  } catch (error) {
    const failure = getAuthStartFailure(error);
    console.error(`Magic-link ${mode} initialization threw:`, failure);
    return { error: failure, next };
  }
}

export async function startGoogleAuth(nextValue: unknown, mode: AuthMode) {
  const next = getSafeNextPath(nextValue);
  logAuthEnvironment(mode, "google");

  try {
    const redirectTo = await getAuthCallbackUrl(next);
    const supabase = await createClient();

    console.info(`Starting Google ${mode}:`, { redirectTo });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    console.info(`Google ${mode} OAuth response:`, {
      hasUrl: Boolean(data.url),
      hasError: Boolean(error),
      redirectTo,
    });

    if (error || !data.url) {
      console.error(`Google ${mode} initialization failed:`, {
        message: error?.message || "Supabase returned no OAuth redirect URL.",
        status: error?.status,
        code: error?.code,
        redirectTo,
      });
    }

    return { data, error, next };
  } catch (error) {
    const failure = getAuthStartFailure(error);
    console.error(`Google ${mode} initialization threw:`, failure);
    return { data: { provider: "google", url: null }, error: failure, next };
  }
}
