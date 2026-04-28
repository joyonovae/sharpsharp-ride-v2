import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!secretKey) {
    return NextResponse.json(
      { status: false, message: "Paystack secret key is missing" },
      { status: 500 }
    );
  }

  const body = await request.json();

  const email = String(body.email || "");
  const amount = Number(body.amount || 0);
  const rideId = String(body.rideId || "");
  const userId = String(body.userId || "");
  const fullName = String(body.fullName || "");
  const phone = String(body.phone || "");
  const seats = Number(body.seats || 1);

  if (
    !email ||
    amount <= 0 ||
    !rideId ||
    !userId ||
    !fullName ||
    !phone ||
    seats < 1
  ) {
    return NextResponse.json(
      { status: false, message: "Missing payment or booking details" },
      { status: 400 }
    );
  }

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
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
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    return NextResponse.json(
      {
        status: false,
        message: data.message || "Could not initialize payment",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: true,
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
  });
}