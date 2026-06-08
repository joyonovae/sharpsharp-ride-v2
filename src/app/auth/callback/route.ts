import { NextResponse } from "next/server";
import { getSafeNextPath, getSiteOrigin } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const redirectOrigin = getSiteOrigin({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    host: requestUrl.host,
    forwardedProtocol: requestUrl.protocol.replace(":", ""),
    isDevelopment: process.env.NODE_ENV === "development",
  });
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (providerError || !code) {
    console.error("Auth callback failed before code exchange:", {
      providerError: providerError || "authorization code is missing",
      errorCode: requestUrl.searchParams.get("error_code"),
    });
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", redirectOrigin)
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback code exchange failed:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", redirectOrigin)
      );
    }

    return NextResponse.redirect(new URL(next, redirectOrigin));
  } catch (error) {
    console.error(
      "Unexpected auth callback failure:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", redirectOrigin)
    );
  }
}
