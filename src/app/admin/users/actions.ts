"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { accountStatusTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendEmail";

async function adminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { actor: user, admin: createAdminClient() };
}
async function communicate(userId: string, name: string, status: "suspended"|"blocked"|"reinstated"|"review_rejected", reason: string, dedupe: string) {
  const result = await createNotification({ userId, title: status === "reinstated" ? "Account reinstated" : status === "review_rejected" ? "Suspension review update" : `Account ${status}`, message: status === "reinstated" ? "Your account is active again." : status === "review_rejected" ? "Your suspension review was not approved." : `Your account has been ${status}.`, type: "account_status", link: status === "reinstated" ? "/dashboard" : "/account/suspension-review", dedupeKey: dedupe });
  if (result.created) { const email = await getAuthUserEmail(userId); if (email) { const template = accountStatusTemplate({ name, status, reason }); const sent = await sendEmail({ to: email, ...template }); if (!sent.success) console.error("Account status email failed:", sent.error); } }
}
export async function suspendUser(formData: FormData) {
  const { actor, admin } = await adminContext();
  const userId = String(formData.get("userId") || ""); const status = String(formData.get("status") || ""); const reason = String(formData.get("reason") || "").trim();
  if (!["suspended","blocked"].includes(status) || !reason) throw new Error("Status and reason are required");
  const { data: target } = await admin.from("profiles").select("role, full_name").eq("id", userId).single();
  if (!target || target.role === "admin") throw new Error("Admin accounts cannot be suspended here");
  const { error } = await admin.from("profiles").update({ account_status: status, suspension_reason: reason, suspended_at: new Date().toISOString(), suspended_by: actor.id, reinstated_at: null }).eq("id", userId);
  if (error) throw new Error(error.message);
  await communicate(userId, target.full_name || "User", status as "suspended"|"blocked", reason, `account_${status}:${userId}:${Date.now()}`);
  revalidatePath("/admin/users"); revalidatePath("/dashboard");
}
export async function reinstateUser(formData: FormData) {
  const { admin } = await adminContext(); const userId = String(formData.get("userId") || "");
  const { data: target } = await admin.from("profiles").select("full_name, role, account_status").eq("id", userId).single();
  if (!target || target.role === "admin") throw new Error("Admin accounts cannot be changed here");
  if (target.account_status === "active") throw new Error("This account is already active");
  const { error } = await admin.from("profiles").update({ account_status: "active", suspension_reason: null, reinstated_at: new Date().toISOString() }).eq("id", userId).neq("role", "admin");
  if (error) throw new Error(error.message);
  await admin.from("suspension_review_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("user_id", userId).eq("status", "pending");
  await communicate(userId, target?.full_name || "User", "reinstated", "", `account_reinstated:${userId}:${Date.now()}`);
  revalidatePath("/admin/users"); revalidatePath("/dashboard");
}
export async function rejectSuspensionReview(formData: FormData) {
  const { actor, admin } = await adminContext(); const requestId = String(formData.get("requestId") || ""); const note = String(formData.get("adminNote") || "").trim();
  const { data: request } = await admin.from("suspension_review_requests").select("user_id").eq("id", requestId).single();
  if (!request) throw new Error("Review request not found");
  const { error } = await admin.from("suspension_review_requests").update({ status: "rejected", admin_note: note, reviewed_by: actor.id, reviewed_at: new Date().toISOString() }).eq("id", requestId).eq("status", "pending");
  if (error) throw new Error(error.message);
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", request.user_id).maybeSingle();
  await communicate(request.user_id, profile?.full_name || "User", "review_rejected", note, `suspension_review_rejected:${requestId}`);
  revalidatePath("/admin/users");
}
