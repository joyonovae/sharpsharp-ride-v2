import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeNextPath, getSiteOrigin } from "@/lib/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type CookieWrite = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function getSafeCallbackDetails(requestUrl: URL) {
  return {
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    hasCode: requestUrl.searchParams.has("code"),
    hasProviderError: Boolean(
      requestUrl.searchParams.get("error_description") ||
        requestUrl.searchParams.get("error")
    ),
  };
}

function createRedirectWithCookies(target: URL, cookieWrites: CookieWrite[]) {
  const response = NextResponse.redirect(target);

  cookieWrites.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const redirectOrigin = getSiteOrigin({
    configuredSiteUrl:
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_SITE_URL
        : undefined,
    host: request.headers.get("x-forwarded-host") || requestUrl.host,
    forwardedProtocol:
      request.headers.get("x-forwarded-proto") ||
      requestUrl.protocol.replace(":", ""),
    isDevelopment: process.env.NODE_ENV === "development",
    preserveRequestHost: true,
  });
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");
  const cookieNames = request.cookies.getAll().map(({ name }) => name);
  const hasPkceVerifier = cookieNames.some((name) =>
    name.endsWith("-code-verifier")
  );

  console.info("Auth callback received:", {
    ...getSafeCallbackDetails(requestUrl),
    next,
    redirectOrigin,
    cookieCount: cookieNames.length,
    hasPkceVerifier,
  });

  if (providerError || !code) {
    console.error("Auth callback failed before code exchange:", {
      providerError: providerError || "authorization code is missing",
      errorCode: requestUrl.searchParams.get("error_code"),
      hasCode: Boolean(code),
      hasPkceVerifier,
    });
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", redirectOrigin)
    );
  }

  if (!hasPkceVerifier) {
    console.error("Auth callback PKCE verifier cookie is missing:", {
      callbackHost: requestUrl.host,
      cookieCount: cookieNames.length,
    });
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", redirectOrigin)
    );
  }

  const cookieWrites: CookieWrite[] = [];

  try {
    const { url, key, keySource } = getSupabasePublicConfig();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieWrites.push({ name, value, options });
          });
        },
      },
    });

    console.info("Auth callback starting code exchange:", {
      supabaseHost: new URL(url).hostname,
      keySource,
      hasPkceVerifier,
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.info("Auth callback code exchange result:", {
      success: Boolean(data.session) && !error,
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user),
      cookieWriteCount: cookieWrites.length,
    });

    if (error || !data.session) {
      console.error("Auth callback code exchange failed:", {
        message: error?.message || "Supabase returned no session.",
        status: error?.status,
        code: error?.code,
        hasPkceVerifier,
        cookieWriteCount: cookieWrites.length,
      });
      return createRedirectWithCookies(
        new URL("/login?error=auth_callback_failed", redirectOrigin),
        cookieWrites
      );
    }

    const finalTarget = new URL(next, redirectOrigin);
    console.info("Auth callback redirecting after successful exchange:", {
      origin: finalTarget.origin,
      pathname: finalTarget.pathname,
      search: finalTarget.search,
      cookieWriteCount: cookieWrites.length,
    });

    return createRedirectWithCookies(finalTarget, cookieWrites);
  } catch (error) {
    console.error("Unexpected auth callback failure:", {
      message: error instanceof Error ? error.message : String(error),
      hasPkceVerifier,
      cookieWriteCount: cookieWrites.length,
    });
    return createRedirectWithCookies(
      new URL("/login?error=auth_callback_failed", redirectOrigin),
      cookieWrites
    );
  }
}
