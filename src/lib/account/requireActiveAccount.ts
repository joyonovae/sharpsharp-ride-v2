import { createClient } from "@/lib/supabase/server";

export async function requireActiveAccount(userId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = userId || user?.id;
  if (!id) throw new Error("Not authorized");
  const { data: profile } = await supabase.from("profiles").select("account_status, suspension_reason").eq("id", id).single();
  if (profile?.account_status && profile.account_status !== "active") {
    throw new Error("Your account is suspended. Request a review from your dashboard.");
  }
  return { user, profile };
}
