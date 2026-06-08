import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { rideRequestSubmittedTemplate } from "@/lib/email/templates";

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

  const { data: rideRequest, error: requestError } = await supabase
    .from("ride_requests")
    .select("full_name, from_city, to_city, travel_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError || !rideRequest) {
    return NextResponse.json(
      { success: false, message: "Ride request could not be loaded." },
      { status: 404 }
    );
  }

  const template = rideRequestSubmittedTemplate({
    name: rideRequest.full_name || "there",
    fromCity: rideRequest.from_city || "your pickup city",
    toCity: rideRequest.to_city || "your destination",
    travelDate: rideRequest.travel_date || "your selected date",
  });

  const result = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
