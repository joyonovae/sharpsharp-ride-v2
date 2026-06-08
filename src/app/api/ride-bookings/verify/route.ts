import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Server error.";
}

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

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack secret key is missing." },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || verifyData?.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    const metadata = verifyData.data.metadata || {};

    const rideId = String(metadata.rideId || "").trim();
    const userId = String(metadata.userId || "").trim();
    const fullName = String(metadata.fullName || "").trim();
    const phone = String(metadata.phone || "").trim();
    const seats = Number(metadata.seats || 1);

    if (
      !rideId ||
      !userId ||
      userId !== user.id ||
      !fullName ||
      !phone ||
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      return NextResponse.json(
        { error: "Invalid booking metadata from Paystack." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existingBooking } = await admin
      .from("ride_bookings")
      .select("id, ride_id, seats_booked")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        reference,
        rideId: existingBooking.ride_id,
        seats: existingBooking.seats_booked,
      });
    }

    const { data: ride, error: rideError } = await admin
      .from("rides")
      .select("id, available_seats, price_per_seat")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    }

    const expectedAmountKobo = Math.round(
      seats * Number(ride.price_per_seat) * 100
    );
    const paidAmountKobo = Number(verifyData.data.amount);

    if (
      verifyData.data.currency !== "NGN" ||
      paidAmountKobo !== expectedAmountKobo
    ) {
      return NextResponse.json(
        { error: "The paid amount does not match this booking." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await admin.rpc(
      "complete_paid_ride_booking",
      {
        p_ride_id: rideId,
        p_user_id: userId,
        p_full_name: fullName,
        p_phone: phone,
        p_seats: seats,
        p_total_amount: expectedAmountKobo / 100,
        p_payment_reference: reference,
      }
    );

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || "Could not complete booking." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      rideId,
      seats,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
