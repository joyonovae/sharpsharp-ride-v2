"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";
export async function submitSuspensionReview(formData: FormData) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login?next=/account/suspension-review");
  const explanation = String(formData.get("explanation") || "").trim(); if (!explanation) throw new Error("Explanation is required");
  const { data: request, error } = await supabase.from("suspension_review_requests").insert({ user_id: user.id, explanation, contact_phone: String(formData.get("contact_phone") || "").trim() || null, supporting_note: String(formData.get("supporting_note") || "").trim() || null }).select("id").single();
  if (error || !request) throw new Error(error?.code === "23505" ? "You already have a pending review request." : error?.message || "Could not submit review");
  await notifyAdmins({ title: "New suspension review request", message: "A suspended user requested account review.", type: "admin_suspension_review", link: "/admin/users", dedupeKey: `admin_suspension_review:${request.id}` });
  redirect("/dashboard");
}
