import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { rideRequestSubmittedTemplate } from "@/lib/email/templates";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";

export async function POST(request: Request) {
  try {
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

    const body = await request.json().catch(() => ({}));
    const requestId = String(body.requestId || "").trim();

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: "Ride request ID is required." },
        { status: 400 }
      );
    }

    const { data: rideRequest, error: requestError } = await supabase
      .from("ride_requests")
      .select("id, full_name, from_city, to_city, travel_date")
      .eq("user_id", user.id)
      .eq("id", requestId)
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

    await notifyAdmins({
      title: "New ride request submitted",
      message: `${rideRequest.full_name || "A passenger"} requested a ride from ${rideRequest.from_city} to ${rideRequest.to_city} for ${rideRequest.travel_date}.`,
      type: "admin_ride_request",
      link: `/admin/ride-requests/${rideRequest.id}`,
      dedupeKey: `admin_ride_request_submitted:${rideRequest.id}`,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ride request email error";
    console.error("Ride request submitted email failed:", message);
    return NextResponse.json(
      { success: false, message: "Could not send ride request email." },
      { status: 500 }
    );
  }
}
