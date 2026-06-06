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
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return supabase;
}

async function fetchApplicationAndProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appId: string
) {
  const { data: application, error: applicationError } = await supabase
    .from("driver_applications")
    .select("id,user_id,full_name,status")
    .eq("id", appId)
    .maybeSingle();

  if (applicationError) {
    console.error("Driver application fetch failed:", applicationError);
    throw new Error(applicationError.message);
  }

  if (!application?.user_id) {
    throw new Error("Driver application was not found or has no user_id.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", application.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("Driver profile fetch failed:", profileError);
    throw new Error(profileError.message);
  }

  if (!profile?.email) {
    throw new Error("Driver profile email was not found.");
  }

  return { application, profile };
}

export async function approveDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) throw new Error("Missing application details");

  const { application, profile } = await fetchApplicationAndProfile(
    supabase,
    appId
  );

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "approved",
      admin_note: "Driver approved by admin.",
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    console.error("Driver application approval failed:", applicationUpdateError);
    throw new Error(applicationUpdateError.message);
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      role: "driver",
      driver_status: "approved",
    })
    .eq("id", application.user_id);

  if (profileUpdateError) {
    console.error("Driver profile approval failed:", profileUpdateError);
    throw new Error(profileUpdateError.message);
  }

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert({
      user_id: application.user_id,
      title: "Driver Application Approved",
      message:
        "Congratulations. Your driver application has been approved. You can now offer rides.",
      type: "driver_application",
      link: "/offer-a-ride/create",
      is_read: false,
    });

  if (notificationError) {
    console.error("Driver approval notification failed:", notificationError);
  }

  const emailResult = await sendDriverStatusEmail(
    profile.email,
    application.full_name || "Driver",
    "approved"
  );

  console.log("Driver approval email result:", emailResult);

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function rejectDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) throw new Error("Missing application details");

  const { application, profile } = await fetchApplicationAndProfile(
    supabase,
    appId
  );

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      admin_note: "Driver application rejected by admin.",
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    console.error("Driver application rejection failed:", applicationUpdateError);
    throw new Error(applicationUpdateError.message);
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      role: "passenger",
      driver_status: "rejected",
    })
    .eq("id", application.user_id);

  if (profileUpdateError) {
    console.error("Driver profile rejection failed:", profileUpdateError);
    throw new Error(profileUpdateError.message);
  }

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert({
      user_id: application.user_id,
      title: "Driver Application Rejected",
      message:
        "Your application was not approved at this time. Please review and reapply.",
      type: "driver_application",
      link: "/apply/driver",
      is_read: false,
    });

  if (notificationError) {
    console.error("Driver rejection notification failed:", notificationError);
  }

  const emailResult = await sendDriverStatusEmail(
    profile.email,
    application.full_name || "Driver",
    "rejected"
  );

  console.log("Driver rejection email result:", emailResult);

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}