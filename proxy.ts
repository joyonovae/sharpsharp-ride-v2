import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (request.nextUrl.pathname === "/auth/callback") {
    return response;
  }

  let supabaseConfig;
  try {
    supabaseConfig = getSupabasePublicConfig();
  } catch (error) {
    console.error(
      "Supabase proxy configuration failed:",
      error instanceof Error ? error.message : error
    );
    return response;
  }

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Supabase session refresh failed in proxy:", error.message);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
