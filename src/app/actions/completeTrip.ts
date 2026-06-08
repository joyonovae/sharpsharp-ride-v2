"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { tripCompletedTemplate } from "@/lib/email/templates";

export async function completeTrip(formData: FormData) {
  const rideId = String(formData.get("rideId") || "");
  if (!rideId) throw new Error("Missing ride ID");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const admin = createAdminClient();
  const [{ data: profile }, { data: ride, error: rideError }] = await Promise.all([
    admin.from("profiles").select("role, full_name").eq("id", user.id).single(),
    admin
      .from("rides")
      .select("id, driver_id, driver_name, from_city, to_city")
      .eq("id", rideId)
      .single(),
  ]);

  if (rideError || !ride) throw new Error(rideError?.message || "Ride not found");
  if (profile?.role !== "admin" && ride.driver_id !== user.id) {
    throw new Error("Only the assigned driver or an admin can complete this trip");
  }

  const { data: completedBookings, error } = await admin
    .from("ride_bookings")
    .update({
      trip_status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    })
    .eq("ride_id", rideId)
    .eq("payment_status", "paid")
    .eq("trip_status", "booked")
    .select("id, user_id, full_name");

  if (error) throw new Error(error.message);
  if (!completedBookings?.length) return;

  await Promise.all(
    completedBookings.map(async (booking) => {
      await createNotification({
        userId: booking.user_id,
        title: "Trip completed",
        message: `Your trip from ${ride.from_city} to ${ride.to_city} has been marked completed.`,
        type: "trip_completed",
        link: "/dashboard/bookings",
        dedupeKey: `trip_completed_passenger:${booking.id}`,
      });

      const email = await getAuthUserEmail(booking.user_id);
      if (email) {
        const template = tripCompletedTemplate({
          name: booking.full_name || "Passenger",
          audience: "passenger",
          fromCity: ride.from_city,
          toCity: ride.to_city,
        });
        const result = await sendEmail({ to: email, ...template });
        if (!result.success) console.error("Passenger trip completion email failed:", result.error);
      }
    })
  );

  if (ride.driver_id) {
    await createNotification({
      userId: ride.driver_id,
      title: "Trip completed",
      message: `Your ${ride.from_city} to ${ride.to_city} trip has been marked completed.`,
      type: "trip_completed",
      link: "/dashboard/driver",
      dedupeKey: `trip_completed_driver:${rideId}`,
    });

    const email = await getAuthUserEmail(ride.driver_id);
    if (email) {
      const template = tripCompletedTemplate({
        name: ride.driver_name || profile?.full_name || "Driver",
        audience: "driver",
        fromCity: ride.from_city,
        toCity: ride.to_city,
      });
      const result = await sendEmail({ to: email, ...template });
      if (!result.success) console.error("Driver trip completion email failed:", result.error);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/driver");
}
