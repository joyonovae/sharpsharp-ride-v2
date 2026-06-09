type SupabasePublicConfig = {
  url: string;
  key: string;
  keySource: "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const key = anonKey || publishableKey;
  const keySource = anonKey
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("Supabase URL must use HTTPS.");
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is malformed.");
  }

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return { url, key, keySource };
}
