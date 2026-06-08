import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";
import { bookingConfirmedTemplate } from "@/lib/email/templates";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";

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
    const requestId = String(metadata.requestId || "").trim() || null;

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
        p_ride_request_id: requestId,
      }
    );

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || "Could not complete booking." },
        { status: 400 }
      );
    }

    if (booking.changed) {
      const { data: bookedRide } = await admin
        .from("rides")
        .select("driver_id, driver_name, from_city, to_city")
        .eq("id", rideId)
        .single();

      const passengerName = fullName || "Passenger";
      await createNotification({
        userId,
        title: "Booking confirmed",
        message: `Your payment was verified and your ${bookedRide?.from_city || "ride"} to ${bookedRide?.to_city || "destination"} booking is confirmed.`,
        type: "booking_confirmed",
        link: "/dashboard/bookings",
        dedupeKey: `booking_confirmed:${reference}`,
      });

      if (user.email) {
        const template = bookingConfirmedTemplate({
          name: passengerName,
          audience: "passenger",
          fromCity: bookedRide?.from_city || "your pickup",
          toCity: bookedRide?.to_city || "your destination",
          seats,
        });
        const emailResult = await sendEmail({ to: user.email, ...template });
        if (!emailResult.success) {
          console.error("Passenger booking confirmation email failed:", emailResult.error);
        }
      }

      if (bookedRide?.driver_id && bookedRide.driver_id !== userId) {
        await createNotification({
          userId: bookedRide.driver_id,
          title: "New paid passenger booking",
          message: `${passengerName} booked ${seats} seat${seats === 1 ? "" : "s"} on your ${bookedRide.from_city} to ${bookedRide.to_city} ride.`,
          type: "passenger_booking",
          link: "/dashboard/driver",
          dedupeKey: `driver_booking:${reference}`,
        });

        const driverEmail = await getAuthUserEmail(bookedRide.driver_id);
        if (driverEmail) {
          const template = bookingConfirmedTemplate({
            name: bookedRide.driver_name || "Driver",
            audience: "driver",
            fromCity: bookedRide.from_city,
            toCity: bookedRide.to_city,
            seats,
          });
          const emailResult = await sendEmail({ to: driverEmail, ...template });
          if (!emailResult.success) {
            console.error("Driver passenger-booking email failed:", emailResult.error);
          }
        }
      }
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
