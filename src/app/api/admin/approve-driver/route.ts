import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔒 CHECK ADMIN EMAIL
  if (user.email !== "onovaejoy4@gmail.com") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { applicationId, userId } = await req.json();

  // ✅ Update application status
  const { error: appError } = await supabase
    .from("driver_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  // ✅ Update user role
  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "driver" })
    .eq("id", userId);

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}