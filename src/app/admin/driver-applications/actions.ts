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

export async function approveDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) throw new Error("Missing application details");

  const { data: application, error: applicationFetchError } = await supabase
    .from("driver_applications")
    .select("id,user_id,full_name")
    .eq("id", appId)
    .maybeSingle();

  if (applicationFetchError) {
    console.error("Approve driver application fetch failed:", applicationFetchError);
    throw new Error(applicationFetchError.message);
  }

  if (!application?.user_id) {
    throw new Error("Driver application user ID is missing.");
  }

  const { data: profile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", application.user_id)
    .maybeSingle();

  if (profileFetchError) {
    console.error("Approve driver profile fetch failed:", profileFetchError);
    throw new Error(profileFetchError.message);
  }

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "approved",
      admin_note: "Driver approved by admin.",
    })
    .eq("id", appId);

  if (applicationUpdateError) {
    console.error("Approve driver application update failed:", applicationUpdateError);
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
    console.error("Approve driver profile update failed:", profileUpdateError);
    throw new Error(profileUpdateError.message);
  }

  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: application.user_id,
    title: "Driver Application Approved",
    message:
      "Congratulations. Your driver application has been approved. You can now offer rides.",
    type: "driver_application",
    link: "/offer-a-ride/create",
    is_read: false,
  });

  if (notificationError) {
    console.error("Approve driver notification failed:", notificationError);
  }

  if (profile?.email) {
    const emailResult = await sendDriverStatusEmail(
      profile.email,
      application.full_name || "Driver",
      "approved"
    );

    console.log("Approve driver email result:", emailResult);
  } else {
    console.error("Approve driver email skipped: profile email is missing", {
      appId,
      userId: application.user_id,
    });
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function rejectDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) throw new Error("Missing application details");

  const { data: application, error: applicationFetchError } = await supabase
    .from("driver_applications")
    .select("id,user_id,full_name")
    .eq("id", appId)
    .maybeSingle();

  if (applicationFetchError) {
    console.error("Reject driver application fetch failed:", applicationFetchError);
    throw new Error(applicationFetchError.message);
  }

  if (!application?.user_id) {
    throw new Error("Driver application user ID is missing.");
  }

  const { data: profile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", application.user_id)
    .maybeSingle();

  if (profileFetchError) {
    console.error("Reject driver profile fetch failed:", profileFetchError);
    throw new Error(profileFetchError.message);
  }

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      admin_note: "Driver application rejected by admin.",
    })
    .eq("id", appId);

  if (applicationUpdateError) {
    console.error("Reject driver application update failed:", applicationUpdateError);
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
    console.error("Reject driver profile update failed:", profileUpdateError);
    throw new Error(profileUpdateError.message);
  }

  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: application.user_id,
    title: "Driver Application Rejected",
    message:
      "Your application was not approved at this time. Please review and reapply.",
    type: "driver_application",
    link: "/apply/driver",
    is_read: false,
  });

  if (notificationError) {
    console.error("Reject driver notification failed:", notificationError);
  }

  if (profile?.email) {
    const emailResult = await sendDriverStatusEmail(
      profile.email,
      application.full_name || "Driver",
      "rejected"
    );

    console.log("Reject driver email result:", emailResult);
  } else {
    console.error("Reject driver email skipped: profile email is missing", {
      appId,
      userId: application.user_id,
    });
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}