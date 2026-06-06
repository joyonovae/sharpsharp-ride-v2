import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const appId = String(body.appId || "");

  if (!appId) {
    return NextResponse.json(
      { success: false, message: "Missing application ID." },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Not authorized." },
      { status: 403 }
    );
  }

  const { data: application, error: applicationError } = await supabase
    .from("driver_applications")
    .select("id,user_id,full_name")
    .eq("id", appId)
    .maybeSingle();

  if (applicationError || !application?.user_id) {
    return NextResponse.json(
      {
        success: false,
        message: applicationError?.message || "Application not found.",
      },
      { status: 404 }
    );
  }

  const { data: driverProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", application.user_id)
    .maybeSingle();

  const { error: applicationUpdateError } = await supabase
    .from("driver_applications")
    .update({
      status: "approved",
      admin_note: "Driver approved by admin.",
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    return NextResponse.json(
      { success: false, message: applicationUpdateError.message },
      { status: 500 }
    );
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      role: "driver",
      driver_status: "approved",
    })
    .eq("id", application.user_id);

  if (profileUpdateError) {
    console.error("Profile update failed:", profileUpdateError);
  }

  await supabase.from("notifications").insert({
    user_id: application.user_id,
    title: "Driver Application Approved",
    message:
      "Congratulations. Your driver application has been approved. You can now offer rides.",
    type: "driver_application",
    link: "/offer-a-ride/create",
    is_read: false,
  });

  if (driverProfile?.email) {
    await sendDriverStatusEmail(
      driverProfile.email,
      application.full_name || "Driver",
      "approved"
    );
  }

  return NextResponse.json({ success: true });
}