import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { driverApplicationSubmittedTemplate } from "@/lib/email/templates";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          stage: "authentication",
          message: "Your session could not be verified.",
          error: authError?.message || "Authenticated user is missing.",
        },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          stage: "recipient",
          message: "Your authenticated account does not have an email address.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body.applicationId || "").trim();

    let applicationQuery = supabase
      .from("driver_applications")
      .select("id, full_name")
      .eq("user_id", user.id);

    if (applicationId) {
      applicationQuery = applicationQuery.eq("id", applicationId);
    }

    const { data: application, error: applicationError } =
      await applicationQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (applicationError || !application) {
      return NextResponse.json(
        {
          success: false,
          stage: "application_lookup",
          message: "The saved driver application could not be loaded.",
          error: applicationError?.message || "Driver application not found.",
        },
        { status: 404 }
      );
    }

    const template = driverApplicationSubmittedTemplate(
      application.full_name || "there"
    );

    const result = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    await notifyAdmins({
      title: "New driver application submitted",
      message: `${application.full_name || "A user"} submitted a driver application for review.`,
      type: "admin_driver_application",
      link: "/admin/driver-applications",
      dedupeKey: `admin_driver_application_submitted:${application.id}`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "email_delivery",
          message: "Resend could not deliver the confirmation email.",
          error: result.error,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Driver application confirmation email sent.",
      recipient: user.email,
      emailId: result.data?.id || null,
    });
  } catch (error: unknown) {
    console.error(
      "Driver application submitted email failed:",
      error instanceof Error ? error.message : "Unknown server error."
    );
    return NextResponse.json(
      {
        success: false,
        stage: "server",
        message: "Unexpected error while sending confirmation email.",
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}
