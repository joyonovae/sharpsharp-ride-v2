"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function submitRideReview(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const context = String(formData.get("context") || "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || "").trim().slice(0, 1000);

  if (!bookingId || !["driver", "passenger"].includes(context)) {
    throw new Error("Invalid review details");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("ride_bookings")
    .select("id, ride_id, user_id, payment_status, trip_status, rides!inner(driver_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) throw new Error("Booking not found");
  if (booking.payment_status !== "paid" || booking.trip_status !== "completed") {
    throw new Error("Only completed paid trips can be reviewed");
  }

  const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
  const driverId = ride?.driver_id;
  const revieweeId =
    context === "driver" && booking.user_id === user.id
      ? driverId
      : context === "passenger" && driverId === user.id
        ? booking.user_id
        : null;

  if (!revieweeId || revieweeId === user.id) throw new Error("Not allowed to review this booking");

  const { error: insertError } = await admin.from("ride_reviews").insert({
    booking_id: booking.id,
    ride_id: booking.ride_id,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    context,
    rating,
    comment: comment || null,
    status: "published",
  });

  if (insertError) {
    if (insertError.code === "23505") return;
    throw new Error(insertError.message);
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/driver");
  revalidatePath(`/drivers/${driverId}`);
}
