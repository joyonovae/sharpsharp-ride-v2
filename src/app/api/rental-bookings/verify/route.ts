import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookingFinalizationError } from "@/lib/paystack/finalizePaidRideBooking";
import { finalizePaidRentalBooking } from "@/lib/paystack/finalizePaidRentalBooking";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in to verify this rental." }, { status: 401 });
    const { reference } = await request.json();
    const booking = await finalizePaidRentalBooking({ reference: String(reference || ""), expectedUserId: user.id });
    const { data: details } = await supabase.from("rental_bookings").select("id, start_date, end_date, pickup_location, return_location, total_amount, vehicles(name, brand, model)").eq("id", booking.bookingId).single();
    return NextResponse.json({ ...booking, details });
  } catch (error) {
    const status = error instanceof BookingFinalizationError ? error.status : 500;
    console.error("Browser rental finalization failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error." }, { status });
  }
}
