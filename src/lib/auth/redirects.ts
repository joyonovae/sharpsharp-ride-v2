const DEFAULT_NEXT_PATH = "/dashboard";

export function getSafeNextPath(value: unknown) {
  const next = String(value || "").trim();

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.includes("\0")
  ) {
    return DEFAULT_NEXT_PATH;
  }

  return next;
}

export function getSiteOrigin({
  configuredSiteUrl,
  host,
  forwardedProtocol,
  isDevelopment,
}: {
  configuredSiteUrl?: string;
  host?: string | null;
  forwardedProtocol?: string | null;
  isDevelopment: boolean;
}) {
  const configured = configuredSiteUrl?.trim().replace(/^["']|["']$/g, "");

  if (configured) {
    try {
      const url = new URL(configured);
      return url.origin;
    } catch {
      console.error("Invalid NEXT_PUBLIC_SITE_URL; falling back to request host.");
    }
  }

  if (!host) {
    return isDevelopment
      ? "http://localhost:3000"
      : "https://www.sharpsharpride.com";
  }

  const protocol = isDevelopment
    ? "http"
    : forwardedProtocol?.split(",")[0]?.trim() || "https";

  return new URL(`${protocol}://${host}`).origin;
}

export function buildAuthCallbackUrl(origin: string, nextValue: unknown) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeNextPath(nextValue));
  return callbackUrl.toString();
}
