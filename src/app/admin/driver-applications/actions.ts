"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return supabase;
}

export async function approveDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");
  const userId = String(formData.get("userId") || "");

  if (!appId || !userId) throw new Error("Missing application details");

  const { data: application } = await supabase
    .from("driver_applications")
    .select("full_name")
    .eq("id", appId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  await supabase
    .from("driver_applications")
    .update({
      status: "approved",
      admin_note: "Driver approved by admin.",
    })
    .eq("id", appId);

  await supabase
    .from("profiles")
    .update({
      role: "driver",
      driver_status: "approved",
    })
    .eq("id", userId);

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Driver Application Approved",
    message:
      "Congratulations. Your driver application has been approved. You can now offer rides.",
    type: "driver_application",
    link: "/offer-a-ride/create",
    is_read: false,
  });

  if (profile?.email) {
    await sendDriverStatusEmail(
      profile.email,
      application?.full_name || "Driver",
      "approved"
    );
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function rejectDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");
  const userId = String(formData.get("userId") || "");

  if (!appId || !userId) throw new Error("Missing application details");

  const { data: application } = await supabase
    .from("driver_applications")
    .select("full_name")
    .eq("id", appId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      admin_note: "Driver application rejected by admin.",
    })
    .eq("id", appId);

  await supabase
    .from("profiles")
    .update({
      role: "passenger",
      driver_status: "rejected",
    })
    .eq("id", userId);

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Driver Application Rejected",
    message:
      "Your application was not approved at this time. Please review and reapply.",
    type: "driver_application",
    link: "/apply/driver",
    is_read: false,
  });

  if (profile?.email) {
    await sendDriverStatusEmail(
      profile.email,
      application?.full_name || "Driver",
      "rejected"
    );
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}