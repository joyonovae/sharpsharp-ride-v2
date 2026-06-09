const DEFAULT_NEXT_PATH = "/dashboard";
const PRODUCTION_ORIGIN = "https://www.sharpsharpride.com";

export function getSafeNextPath(value: unknown) {
  const next = String(value || "").trim();

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(next)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const decodedForValidation = decodeURIComponent(next);
    if (
      decodedForValidation.startsWith("//") ||
      decodedForValidation.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decodedForValidation)
    ) {
      return DEFAULT_NEXT_PATH;
    }

    const parsed = new URL(next, "https://internal.sharpsharpride.local");
    if (parsed.origin !== "https://internal.sharpsharpride.local") {
      return DEFAULT_NEXT_PATH;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}

export function getSiteOrigin({
  configuredSiteUrl,
  host,
  forwardedProtocol,
  isDevelopment,
  preserveRequestHost = false,
}: {
  configuredSiteUrl?: string;
  host?: string | null;
  forwardedProtocol?: string | null;
  isDevelopment: boolean;
  preserveRequestHost?: boolean;
}) {
  const configured = configuredSiteUrl?.trim().replace(/^["']|["']$/g, "");

  if (configured) {
    try {
      const url = new URL(configured);

      if (
        !isDevelopment &&
        ["sharpsharpride.com", "www.sharpsharpride.com"].includes(url.hostname)
      ) {
        return PRODUCTION_ORIGIN;
      }

      return url.origin;
    } catch {
      console.error("Invalid NEXT_PUBLIC_SITE_URL; falling back to request host.");
    }
  }

  if (!host) {
    return isDevelopment
      ? "http://localhost:3000"
      : PRODUCTION_ORIGIN;
  }

  const protocol = isDevelopment
    ? "http"
    : forwardedProtocol?.split(",")[0]?.trim() || "https";

  const requestOrigin = new URL(`${protocol}://${host}`).origin;

  if (
    !isDevelopment &&
    !preserveRequestHost &&
    ["sharpsharpride.com", "www.sharpsharpride.com"].includes(
      new URL(requestOrigin).hostname
    )
  ) {
    return PRODUCTION_ORIGIN;
  }

  return requestOrigin;
}

export function buildAuthCallbackUrl(origin: string, nextValue: unknown) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeNextPath(nextValue));
  return callbackUrl.toString();
}

export function getAuthErrorMessage(value: unknown) {
  switch (String(value || "")) {
    case "email_required":
      return "Please enter your email address.";
    case "auth_start_failed":
      return "Authentication could not be started. Please try again.";
    case "auth_callback_failed":
      return "Authentication could not be completed. Please try again.";
    default:
      return value ? "Authentication failed. Please try again." : "";
  }
}

export function getAuthMessage(value: unknown) {
  return String(value || "") === "magic_link_sent"
    ? "Check your email to continue."
    : String(value || "");
}
