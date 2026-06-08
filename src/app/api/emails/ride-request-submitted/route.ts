import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { rideRequestSubmittedTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
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

  const body = await request.json();

  const template = rideRequestSubmittedTemplate({
    name: body.full_name || "there",
    fromCity: body.from_city || "your pickup city",
    toCity: body.to_city || "your destination",
    travelDate: body.travel_date || "your selected date",
  });

  const result = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  console.log("Ride request submitted email result:", result);

  return NextResponse.json(result);
}