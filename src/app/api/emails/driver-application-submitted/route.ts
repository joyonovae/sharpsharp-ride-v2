import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { driverApplicationSubmittedTemplate } from "@/lib/email/templates";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json(
      { success: false, message: "User not authenticated." },
      { status: 401 }
    );
  }

  const { data: application } = await supabase
    .from("driver_applications")
    .select("full_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const template = driverApplicationSubmittedTemplate(
    application?.full_name || "there"
  );

  const result = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
