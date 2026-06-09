export function getSupabaseBrowserEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasPublishableKey: Boolean(supabasePublishableKey),
    isReady: Boolean(
      supabaseUrl && (supabaseAnonKey || supabasePublishableKey)
    ),
  };
}
