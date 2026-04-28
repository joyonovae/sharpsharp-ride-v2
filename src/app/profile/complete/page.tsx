import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileCompletePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ❌ Not logged in
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // ✅ If profile already exists → go dashboard
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="p-10 text-white">
      <h1>Complete Profile Page</h1>
      <p>Form goes here...</p>
    </div>
  );
}