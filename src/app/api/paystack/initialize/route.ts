import { NextResponse } from "next/server";

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

    const body = await request.json();

    const email = String(body.email || "").trim();
    const amount = Number(body.amount || 0);
    const rideId = String(body.rideId || "").trim();
    const userId = String(body.userId || "").trim();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const seats = Number(body.seats || 1);

    if (!email || amount <= 0 || !rideId || !userId || !fullName || !phone || seats < 1) {
      return NextResponse.json(
        { status: false, message: "Missing payment or booking details." },
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
        email,
        amount: Math.round(amount * 100),
        currency: "NGN",
        callback_url: `${siteUrl}/booking-success`,
        metadata: {
          rideId,
          userId,
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
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}