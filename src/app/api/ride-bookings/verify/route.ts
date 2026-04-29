import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
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

    if (!rideId || !userId || !fullName || !phone || seats < 1) {
      return NextResponse.json(
        { error: "Missing booking metadata from Paystack." },
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

    await admin.from("profiles").upsert(
      {
        id: userId,
        role: "passenger",
        driver_status: "none",
      },
      { onConflict: "id" }
    );

    const { data: ride, error: rideError } = await admin
      .from("rides")
      .select("id, available_seats, price_per_seat")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    }

    const availableSeats = Number(ride.available_seats);

    if (seats > availableSeats) {
      return NextResponse.json(
        { error: `Only ${availableSeats} seat(s) available.` },
        { status: 400 }
      );
    }

    const totalAmount = seats * Number(ride.price_per_seat);

    const { error: bookingError } = await admin.from("ride_bookings").insert({
      ride_id: rideId,
      user_id: userId,
      full_name: fullName,
      phone,
      seats_booked: seats,
      total_amount: totalAmount,
      booking_reference: reference,
      payment_reference: reference,
      payment_status: "paid",
    });

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      );
    }

    const { error: seatError } = await admin
      .from("rides")
      .update({
        available_seats: availableSeats - seats,
      })
      .eq("id", rideId);

    if (seatError) {
      return NextResponse.json(
        { error: seatError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      rideId,
      seats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error." },
      { status: 500 }
    );
  }
}