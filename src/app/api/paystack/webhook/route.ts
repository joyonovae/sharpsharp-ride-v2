import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  BookingFinalizationError,
  finalizePaidRideBooking,
} from "@/lib/paystack/finalizePaidRideBooking";

export const runtime = "nodejs";

function hasValidSignature(rawBody: string, signature: string, secretKey: string) {
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    console.error("Paystack webhook failed: PAYSTACK_SECRET_KEY is missing.");
    return NextResponse.json({ received: false }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  if (!signature || !hasValidSignature(rawBody, signature, secretKey)) {
    console.error("Paystack webhook rejected: invalid signature.");
    return NextResponse.json({ received: false }, { status: 401 });
  }

  let event: { event?: unknown; data?: { reference?: unknown } };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = String(event.data?.reference || "").trim();
  if (!reference) {
    console.error("Paystack charge.success webhook has no reference.");
    return NextResponse.json({ received: false }, { status: 400 });
  }

  try {
    const booking = await finalizePaidRideBooking({ reference });
    return NextResponse.json({
      received: true,
      bookingId: booking.bookingId,
      changed: booking.changed,
    });
  } catch (error) {
    console.error(
      "Paystack webhook booking finalization failed:",
      error instanceof Error ? error.message : error
    );

    const status =
      error instanceof BookingFinalizationError && error.status < 500
        ? error.status
        : 500;
    return NextResponse.json({ received: false }, { status });
  }
}
