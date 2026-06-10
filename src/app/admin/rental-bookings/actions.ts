"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { rentalBookingTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendEmail";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return createAdminClient();
}

export async function updateRentalBookingStatus(formData: FormData) {
  const admin = await requireAdmin();
  const bookingId = String(formData.get("bookingId") || "");
  const status = String(formData.get("status") || "");
  if (!["completed", "cancelled"].includes(status)) throw new Error("Invalid rental status");
  const { data: booking, error } = await admin.from("rental_bookings").select("*, vehicles(name, brand, model)").eq("id", bookingId).single();
  if (error || !booking) throw new Error(error?.message || "Rental booking not found");
  if (booking.booking_status === status || booking.booking_status === "completed" || booking.booking_status === "cancelled") return;
  const timestamp = new Date().toISOString();
  const { error: updateError } = await admin.from("rental_bookings").update({
    booking_status: status,
    payment_status: booking.payment_status,
    completed_at: status === "completed" ? timestamp : booking.completed_at,
    cancelled_at: status === "cancelled" ? timestamp : booking.cancelled_at,
    updated_at: timestamp,
  }).eq("id", bookingId).eq("booking_status", booking.booking_status);
  if (updateError) throw new Error(updateError.message);
  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
  const vehicleName = vehicle?.name || `${vehicle?.brand || ""} ${vehicle?.model || ""}`.trim() || "Rental vehicle";
  const recipients: Array<{ id: string; name: string; audience: "renter" | "owner" }> = [{ id: booking.user_id, name: booking.full_name, audience: "renter" }];
  if (booking.owner_user_id && booking.owner_user_id !== booking.user_id) recipients.push({ id: booking.owner_user_id, name: "Rental Owner", audience: "owner" as const });
  for (const recipient of recipients) {
    const notification = await createNotification({ userId: recipient.id, title: `Rental booking ${status}`, message: `${vehicleName} rental booking has been ${status}.`, type: `rental_booking_${status}`, link: "/dashboard/rentals", dedupeKey: `rental_booking_${status}:${bookingId}:${recipient.id}` });
    if (notification.created) {
      const email = await getAuthUserEmail(recipient.id);
      if (email) {
        const template = rentalBookingTemplate({ name: recipient.name, audience: recipient.audience, status: status as "completed" | "cancelled", vehicle: vehicleName, startDate: booking.start_date, endDate: booking.end_date, totalAmount: Number(booking.total_amount) });
        const result = await sendEmail({ to: email, ...template });
        if (!result.success) console.error("Rental status email failed:", result.error);
      }
    }
  }
  revalidatePath("/admin/rental-bookings"); revalidatePath("/dashboard/rentals");
}
