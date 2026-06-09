import { NextResponse } from "next/server";
import {
  BookingFinalizationError,
  finalizePaidRideBooking,
} from "@/lib/paystack/finalizePaidRideBooking";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to verify this booking." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const reference = String(body.reference || "").trim();
    const booking = await finalizePaidRideBooking({
      reference,
      expectedUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      reference: booking.reference,
      rideId: booking.rideId,
      seats: booking.seats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error.";
    const status =
      error instanceof BookingFinalizationError ? error.status : 500;

    console.error("Browser booking finalization failed:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
