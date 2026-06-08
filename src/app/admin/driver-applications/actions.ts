"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";
import { createNotification } from "@/lib/notifications/createNotification";

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

  return createAdminClient();
}

async function fetchApplicationAndProfile(
  supabase: ReturnType<typeof createAdminClient>,
  appId: string
) {
  const { data: application, error: applicationError } = await supabase
    .from("driver_applications")
    .select("id,user_id,full_name,status")
    .eq("id", appId)
    .maybeSingle();

  if (applicationError) {
    console.error("Driver application fetch failed:", applicationError);
    return { application: null, email: null };
  }

  if (!application?.user_id) {
    console.error("Driver application was not found or has no user_id.");
    return { application: null, email: null };
  }

  const email = await getAuthUserEmail(application.user_id);
  return { application, email };
}

export async function approveDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) {
    console.error("Approve driver failed: missing appId.");
    return;
  }

  const { application, email } = await fetchApplicationAndProfile(
    supabase,
    appId
  );

  if (!application) {
    revalidatePath("/admin/driver-applications");
    return;
  }

  if (application.status !== "pending") {
    console.error("Driver approval skipped: application is not pending.");
    return;
  }

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "approved",
      admin_note: "Driver approved by admin.",
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    console.error("Driver application approval failed:", applicationUpdateError);
    revalidatePath("/admin/driver-applications");
    return;
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
  }

  await createNotification({
      userId: application.user_id,
      title: "Driver Application Approved",
      message:
        "Congratulations. Your driver application has been approved. You can now offer rides.",
      type: "driver_application",
      link: "/offer-a-ride/create",
      dedupeKey: `driver_application_approved:${application.id}`,
    });

  if (email) {
    const emailResult = await sendDriverStatusEmail(
      email,
      application.full_name || "Driver",
      "approved"
    );

    if (!emailResult.success) {
      console.error("Driver approval email failed:", emailResult.error);
    }
  } else {
    console.error("Driver approval email skipped: auth email is missing.");
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function rejectDriver(formData: FormData) {
  const supabase = await requireAdmin();

  const appId = String(formData.get("appId") || "");

  if (!appId) {
    console.error("Reject driver failed: missing appId.");
    return;
  }

  const { application, email } = await fetchApplicationAndProfile(
    supabase,
    appId
  );

  if (!application) {
    revalidatePath("/admin/driver-applications");
    return;
  }

  if (application.status !== "pending") {
    console.error("Driver rejection skipped: application is not pending.");
    return;
  }

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      admin_note: "Driver application rejected by admin.",
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    console.error("Driver application rejection failed:", applicationUpdateError);
    revalidatePath("/admin/driver-applications");
    return;
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
  }

  await createNotification({
      userId: application.user_id,
      title: "Driver Application Rejected",
      message:
        "Your application was not approved at this time. Please review and reapply.",
      type: "driver_application",
      link: "/apply/driver",
      dedupeKey: `driver_application_rejected:${application.id}`,
    });

  if (email) {
    const emailResult = await sendDriverStatusEmail(
      email,
      application.full_name || "Driver",
      "rejected"
    );

    if (!emailResult.success) {
      console.error("Driver rejection email failed:", emailResult.error);
    }
  } else {
    console.error("Driver rejection email skipped: auth email is missing.");
  }

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function deleteRejectedDriverApplication(formData: FormData) {
  const supabase = await requireAdmin();
  const appId = String(formData.get("appId") || "");

  if (!appId) throw new Error("Missing application ID");

  const { data: application, error: fetchError } = await supabase
    .from("driver_applications")
    .select("id, status")
    .eq("id", appId)
    .single();

  if (fetchError || !application) {
    throw new Error(fetchError?.message || "Driver application not found");
  }

  if (application.status !== "rejected") {
    throw new Error("Only rejected driver applications can be removed");
  }

  const { error } = await supabase
    .from("driver_applications")
    .delete()
    .eq("id", appId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/driver-applications");
  revalidatePath("/admin");
}
