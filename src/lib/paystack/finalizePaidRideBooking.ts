import "server-only";

import { bookingConfirmedTemplate } from "@/lib/email/templates";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { createNotification } from "@/lib/notifications/createNotification";
import { createAdminClient } from "@/lib/supabase/admin";

type PaystackMetadata = {
  rideId?: unknown;
  userId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  seats?: unknown;
  requestId?: unknown;
};

type VerifiedTransaction = {
  reference?: unknown;
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
  metadata?: PaystackMetadata | null;
};

type BookingRpcResult = {
  changed: boolean;
  booking_id: string;
  ride_id: string;
  ride_request_id: string | null;
  seats?: number;
};

export type FinalizedBooking = {
  success: true;
  changed: boolean;
  bookingId: string;
  reference: string;
  rideId: string;
  seats: number;
};

export class BookingFinalizationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingFinalizationError";
    this.status = status;
  }
}

function requirePaystackSecret() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new BookingFinalizationError("Paystack secret key is missing.", 500);
  }

  return secretKey;
}

async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${requirePaystackSecret()}`,
      },
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => null);
  const transaction = payload?.data as VerifiedTransaction | undefined;

  if (!response.ok || payload?.status !== true || transaction?.status !== "success") {
    throw new BookingFinalizationError("Payment verification failed.", 400);
  }

  if (String(transaction.reference || "") !== reference) {
    throw new BookingFinalizationError("Payment reference does not match.", 400);
  }

  return transaction;
}

async function sendBookingCommunications({
  bookingId,
  reference,
  rideId,
  userId,
  passengerName,
  seats,
}: {
  bookingId: string;
  reference: string;
  rideId: string;
  userId: string;
  passengerName: string;
  seats: number;
}) {
  const admin = createAdminClient();
  const { data: bookedRide, error } = await admin
    .from("rides")
    .select("driver_id, driver_name, from_city, to_city")
    .eq("id", rideId)
    .single();

  if (error || !bookedRide) {
    console.error("Booking communication ride lookup failed:", error?.message);
    return;
  }

  try {
    const passengerNotification = await createNotification({
      userId,
      title: "Booking confirmed",
      message: `Your payment was verified and your ${bookedRide.from_city || "ride"} to ${bookedRide.to_city || "destination"} booking is confirmed.`,
      type: "booking_confirmed",
      link: "/dashboard/bookings",
      dedupeKey: `booking_confirmed:${reference}`,
    });

    if (passengerNotification.created) {
      const passengerEmail = await getAuthUserEmail(userId);
      if (passengerEmail) {
        const template = bookingConfirmedTemplate({
          name: passengerName,
          audience: "passenger",
          fromCity: bookedRide.from_city || "your pickup",
          toCity: bookedRide.to_city || "your destination",
          seats,
        });
        const emailResult = await sendEmail({ to: passengerEmail, ...template });
        if (!emailResult.success) {
          console.error("Passenger booking confirmation email failed:", emailResult.error);
        }
      }
    }
  } catch (communicationError) {
    console.error("Passenger booking communication failed:", communicationError);
  }

  if (!bookedRide.driver_id || bookedRide.driver_id === userId) return;

  try {
    const driverNotification = await createNotification({
      userId: bookedRide.driver_id,
      title: "New paid passenger booking",
      message: `${passengerName} booked ${seats} seat${seats === 1 ? "" : "s"} on your ${bookedRide.from_city} to ${bookedRide.to_city} ride.`,
      type: "passenger_booking",
      link: "/dashboard/driver",
      dedupeKey: `driver_booking:${reference}`,
    });

    if (driverNotification.created) {
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
  } catch (communicationError) {
    console.error("Driver booking communication failed:", communicationError);
  }

  console.info("Booking communications processed:", { bookingId, reference });
}

export async function finalizePaidRideBooking({
  reference,
  expectedUserId,
}: {
  reference: string;
  expectedUserId?: string;
}): Promise<FinalizedBooking> {
  const normalizedReference = reference.trim();
  if (!normalizedReference) {
    throw new BookingFinalizationError("Payment reference is required.", 400);
  }

  const transaction = await verifyPaystackTransaction(normalizedReference);
  const metadata = transaction.metadata || {};
  const rideId = String(metadata.rideId || "").trim();
  const userId = String(metadata.userId || "").trim();
  const fullName = String(metadata.fullName || "").trim();
  const phone = String(metadata.phone || "").trim();
  const seats = Number(metadata.seats || 1);
  const requestId = String(metadata.requestId || "").trim() || null;

  if (
    !rideId ||
    !userId ||
    !fullName ||
    !phone ||
    !Number.isInteger(seats) ||
    seats < 1
  ) {
    throw new BookingFinalizationError("Invalid booking metadata from Paystack.", 400);
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new BookingFinalizationError("This payment belongs to another user.", 403);
  }

  const admin = createAdminClient();
  const { data: existingBooking, error: existingError } = await admin
    .from("ride_bookings")
    .select("id, ride_id, seats_booked")
    .eq("payment_reference", normalizedReference)
    .maybeSingle();

  if (existingError) {
    throw new BookingFinalizationError(existingError.message, 500);
  }

  if (existingBooking) {
    return {
      success: true,
      changed: false,
      bookingId: existingBooking.id,
      reference: normalizedReference,
      rideId: existingBooking.ride_id,
      seats: existingBooking.seats_booked,
    };
  }

  const { data: ride, error: rideError } = await admin
    .from("rides")
    .select("id, price_per_seat")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    throw new BookingFinalizationError("Ride not found.", 404);
  }

  const expectedAmountKobo = Math.round(seats * Number(ride.price_per_seat) * 100);
  const paidAmountKobo = Number(transaction.amount);

  if (transaction.currency !== "NGN" || paidAmountKobo !== expectedAmountKobo) {
    throw new BookingFinalizationError(
      "The paid amount does not match this booking.",
      400
    );
  }

  const { data, error } = await admin.rpc("complete_paid_ride_booking", {
    p_ride_id: rideId,
    p_user_id: userId,
    p_full_name: fullName,
    p_phone: phone,
    p_seats: seats,
    p_total_amount: expectedAmountKobo / 100,
    p_payment_reference: normalizedReference,
    p_ride_request_id: requestId,
  });

  if (error || !data) {
    throw new BookingFinalizationError(
      error?.message || "Could not complete booking.",
      400
    );
  }

  const booking = data as BookingRpcResult;

  if (booking.changed) {
    await sendBookingCommunications({
      bookingId: booking.booking_id,
      reference: normalizedReference,
      rideId,
      userId,
      passengerName: fullName || "Passenger",
      seats,
    });
  }

  return {
    success: true,
    changed: booking.changed,
    bookingId: booking.booking_id,
    reference: normalizedReference,
    rideId: booking.ride_id || rideId,
    seats: booking.seats || seats,
  };
}
