import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { success: false, message: "Missing application ID" },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } = await supabase
      .from("driver_applications")
      .select("*")
      .eq("id", appId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", application.user_id)
      .single();

    const { error: appUpdateError } = await supabase
      .from("driver_applications")
      .update({
        status: "approved",
        admin_note: "Driver approved by admin.",
      })
      .eq("id", appId);

    if (appUpdateError) {
      return NextResponse.json(
        { success: false, message: appUpdateError.message },
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
      console.error(profileUpdateError);
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

    if (profile?.email) {
      try {
        await sendDriverStatusEmail(
          profile.email,
          application.full_name || "Driver",
          "approved"
        );
      } catch (emailError) {
        console.error("Email send failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Driver approved successfully",
    });
  } catch (error) {
    console.error("Approve route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}