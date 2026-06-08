import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json(
      { success: false, message: "Please log in before testing email." },
      { status: 401 }
    );
  }

  const result = await sendEmail({
    to: user.email,
    subject: "SharpSharp Ride Email Test",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:28px; border:1px solid #e5e7eb;">
          <h1 style="color:#061116; margin:0 0 12px;">SharpSharp Ride Email Test</h1>
          <p style="color:#334155; font-size:15px; line-height:1.7;">
            Great news! Your SharpSharp Ride email system is connected successfully.
          </p>
          <p style="color:#334155; font-size:15px; line-height:1.7;">
            This email was sent from your Resend setup.
          </p>
          <div style="margin-top:24px; padding:16px; background:#ecfdf5; border-radius:14px; color:#065f46; font-weight:700;">
            Email system is working.
          </div>
        </div>
      </div>
    `,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
