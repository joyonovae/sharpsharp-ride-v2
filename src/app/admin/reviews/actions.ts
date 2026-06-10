"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setReviewStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  const status = String(formData.get("status") || "");
  if (!["published", "hidden"].includes(status)) throw new Error("Invalid review status");
  const admin = createAdminClient();
  const { error } = await admin.from("ride_reviews").update({ status }).eq("id", String(formData.get("reviewId") || ""));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
}
