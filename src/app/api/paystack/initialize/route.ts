import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Server error.";
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://sharpsharp-ride-v2.vercel.app";

    if (!secretKey) {
      return NextResponse.json(
        { status: false, message: "Paystack secret key is missing in Vercel." },
        { status: 500 }
      );
    }

    if (!secretKey.startsWith("sk_")) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Invalid Paystack secret key. PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { status: false, message: "Please log in before booking." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rideId = String(body.rideId || "").trim();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const seats = Number(body.seats || 1);

    if (!rideId || !fullName || !phone || !Number.isInteger(seats) || seats < 1) {
      return NextResponse.json(
        { status: false, message: "Missing payment or booking details." },
        { status: 400 }
      );
    }

    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, available_seats, price_per_seat")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json(
        { status: false, message: "Ride not found." },
        { status: 404 }
      );
    }

    if (seats > Number(ride.available_seats)) {
      return NextResponse.json(
        {
          status: false,
          message: `Only ${ride.available_seats} seat(s) available.`,
        },
        { status: 400 }
      );
    }

    const amountKobo = Math.round(
      Number(ride.price_per_seat) * seats * 100
    );

    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      return NextResponse.json(
        { status: false, message: "Ride price is invalid." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        currency: "NGN",
        callback_url: `${siteUrl}/booking-success`,
        metadata: {
          rideId,
          userId: user.id,
          fullName,
          phone,
          seats,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          status: false,
          message: data.message || "Could not initialize payment.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
