import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";

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

  const result = await sendDriverStatusEmail(
    user.email,
    user.user_metadata?.full_name || "Driver",
    "approved"
  );

  return NextResponse.json(result);
}