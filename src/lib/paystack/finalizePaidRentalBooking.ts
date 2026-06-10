import "server-only";

import { rentalBookingTemplate } from "@/lib/email/templates";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { createNotification } from "@/lib/notifications/createNotification";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingFinalizationError } from "./finalizePaidRideBooking";

type RentalMetadata = {
  type?: unknown; vehicleId?: unknown; userId?: unknown; fullName?: unknown;
  phone?: unknown; startDate?: unknown; endDate?: unknown; rentalDays?: unknown;
  pickupLocation?: unknown; returnLocation?: unknown; notes?: unknown;
};

export type FinalizedRentalBooking = {
  success: true; changed: boolean; bookingId: string; reference: string; vehicleId: string;
};

async function verifyTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) throw new BookingFinalizationError("Paystack secret key is missing.", 500);
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== true || payload?.data?.status !== "success") {
    throw new BookingFinalizationError("Rental payment verification failed.", 400);
  }
  if (String(payload.data.reference || "") !== reference) throw new BookingFinalizationError("Payment reference does not match.", 400);
  return payload.data as { reference: string; amount: number; currency: string; customer?: { email?: string }; metadata?: RentalMetadata };
}

async function communicate(bookingId: string, reference: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin.from("rental_bookings").select("*, vehicles(name, brand, model)").eq("id", bookingId).single();
  if (!booking) return;
  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
  const vehicleName = vehicle?.name || `${vehicle?.brand || ""} ${vehicle?.model || ""}`.trim() || "Rental vehicle";
  const renterNotification = await createNotification({
    userId: booking.user_id, title: "Rental booking confirmed",
    message: `Your payment for ${vehicleName} has been confirmed.`,
    type: "rental_booking_confirmed", link: "/dashboard/rentals",
    dedupeKey: `rental_booking_confirmed:${reference}`,
  });
  if (renterNotification.created) {
    const email = await getAuthUserEmail(booking.user_id);
    if (email) {
      const template = rentalBookingTemplate({ name: booking.full_name, audience: "renter", status: "confirmed", vehicle: vehicleName, startDate: booking.start_date, endDate: booking.end_date, totalAmount: Number(booking.total_amount) });
      const result = await sendEmail({ to: email, ...template });
      if (!result.success) console.error("Rental renter email failed:", result.error);
    }
  }
  if (booking.owner_user_id && booking.owner_user_id !== booking.user_id) {
    const ownerNotification = await createNotification({
      userId: booking.owner_user_id, title: "Your rental vehicle was booked",
      message: `${vehicleName} received a paid rental booking.`,
      type: "rental_vehicle_booked", link: "/dashboard/rentals",
      dedupeKey: `rental_owner_booking:${reference}`,
    });
    if (ownerNotification.created) {
      const email = await getAuthUserEmail(booking.owner_user_id);
      if (email) {
        const template = rentalBookingTemplate({ name: "Rental Owner", audience: "owner", status: "confirmed", vehicle: vehicleName, startDate: booking.start_date, endDate: booking.end_date, totalAmount: Number(booking.total_amount) });
        const result = await sendEmail({ to: email, ...template });
        if (!result.success) console.error("Rental owner email failed:", result.error);
      }
    }
  }
  await notifyAdmins({
    title: "New paid rental booking", message: `${booking.full_name} paid for ${vehicleName}.`,
    details: `${booking.start_date} to ${booking.end_date} | NGN ${Number(booking.total_amount).toLocaleString()}`,
    type: "admin_rental_booking", link: "/admin/rental-bookings", dedupeKey: `admin_rental_booking:${reference}`,
  });
}

export async function finalizePaidRentalBooking({ reference, expectedUserId }: { reference: string; expectedUserId?: string }): Promise<FinalizedRentalBooking> {
  const normalized = reference.trim();
  if (!normalized) throw new BookingFinalizationError("Payment reference is required.", 400);
  const transaction = await verifyTransaction(normalized);
  const metadata = transaction.metadata || {};
  if (metadata.type !== "rental_booking") throw new BookingFinalizationError("Payment is not a rental booking.", 400);
  const vehicleId = String(metadata.vehicleId || "").trim();
  const userId = String(metadata.userId || "").trim();
  const fullName = String(metadata.fullName || "").trim();
  const phone = String(metadata.phone || "").trim();
  const startDate = String(metadata.startDate || "").trim();
  const endDate = String(metadata.endDate || "").trim();
  const rentalDays = Number(metadata.rentalDays);
  const pickupLocation = String(metadata.pickupLocation || "").trim();
  const returnLocation = String(metadata.returnLocation || "").trim();
  const notes = String(metadata.notes || "").trim() || null;
  if (!vehicleId || !userId || !fullName || !phone || !startDate || !endDate || !pickupLocation || !returnLocation || !Number.isInteger(rentalDays) || rentalDays < 1) {
    throw new BookingFinalizationError("Invalid rental metadata from Paystack.", 400);
  }
  if (expectedUserId && expectedUserId !== userId) throw new BookingFinalizationError("This payment belongs to another user.", 403);
  const admin = createAdminClient();
  const { data: vehicle, error: vehicleError } = await admin.from("vehicles").select("id, price_per_day, is_available").eq("id", vehicleId).single();
  if (vehicleError || !vehicle || !vehicle.is_available) throw new BookingFinalizationError("Rental vehicle is not available.", 404);
  const expectedAmount = Number(vehicle.price_per_day) * rentalDays;
  if (transaction.currency !== "NGN" || Number(transaction.amount) !== Math.round(expectedAmount * 100)) throw new BookingFinalizationError("The paid amount does not match this rental.", 400);
  const { data, error } = await admin.rpc("complete_paid_rental_booking", {
    p_vehicle_id: vehicleId, p_user_id: userId, p_full_name: fullName, p_phone: phone,
    p_email: transaction.customer?.email || null, p_start_date: startDate, p_end_date: endDate,
    p_pickup_location: pickupLocation, p_return_location: returnLocation, p_rental_days: rentalDays,
    p_total_amount: expectedAmount, p_payment_reference: normalized, p_notes: notes,
  });
  if (error || !data) throw new BookingFinalizationError(error?.message || "Could not complete rental booking.", 400);
  const result = data as { changed: boolean; booking_id: string; vehicle_id: string };
  if (result.changed) await communicate(result.booking_id, normalized);
  return { success: true, changed: result.changed, bookingId: result.booking_id, reference: normalized, vehicleId: result.vehicle_id };
}
