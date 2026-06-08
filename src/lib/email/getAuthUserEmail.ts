import { createAdminClient } from "@/lib/supabase/admin";

export async function getAuthUserEmail(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    console.error("Could not load auth user email:", error.message);
    return null;
  }

  return data.user?.email || null;
}
