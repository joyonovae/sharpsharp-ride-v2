"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Not authorized");
  }

  return supabase;
}

export async function markRideRequestMatched(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");

  if (!requestId) {
    throw new Error("Missing request ID");
  }

  const { data: request } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  await supabase
    .from("ride_requests")
    .update({
      status: "matched",
      admin_note: "Passenger request has been matched by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (request?.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Ride request matched",
      message: `Your ${request.from_city} → ${request.to_city} ride request for ${request.travel_date} has been matched.`,
      type: "ride_request_matched",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath("/dashboard");
}

export async function cancelRideRequest(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");

  if (!requestId) {
    throw new Error("Missing request ID");
  }

  const { data: request } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  await supabase
    .from("ride_requests")
    .update({
      status: "cancelled",
      admin_note: "Passenger request was cancelled by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (request?.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Ride request cancelled",
      message: `Your ${request.from_city} → ${request.to_city} ride request has been cancelled.`,
      type: "ride_request_cancelled",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath("/dashboard");
}

export async function assignRideToRequest(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");
  const rideId = String(formData.get("rideId") || "");
  const driverId = String(formData.get("driverId") || "");

  if (!requestId || !rideId) {
    throw new Error("Missing assignment details");
  }

  // GET REQUEST
  const { data: request, error: requestError } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error("Ride request not found");
  }

  // GET RIDE
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    throw new Error("Ride not found");
  }

  const passengersNeeded = Number(request.passenger_count || 1);
  const availableSeats = Number(ride.available_seats || 0);

  // PREVENT OVERBOOKING
  if (availableSeats < passengersNeeded) {
    throw new Error("Not enough available seats");
  }

  const updatedSeats = availableSeats - passengersNeeded;

  // UPDATE REQUEST
  const { error: requestUpdateError } = await supabase
    .from("ride_requests")
    .update({
      status: "assigned",
      assigned_ride_id: rideId,
      assigned_driver_id: driverId || null,
      assigned_at: new Date().toISOString(),
      admin_note: "Ride assigned by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    throw new Error(requestUpdateError.message);
  }

  // UPDATE RIDE SEATS
  const { error: rideUpdateError } = await supabase
    .from("rides")
    .update({
      available_seats: updatedSeats,
    })
    .eq("id", rideId);

  if (rideUpdateError) {
    throw new Error(rideUpdateError.message);
  }

  // CREATE NOTIFICATION
  if (request.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Ride assigned",
      message: `Your ride request from ${request.from_city} to ${request.to_city} has been assigned to a driver.`,
      type: "ride_assigned",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath(`/admin/ride-requests/${requestId}`);
  revalidatePath("/rides");
  revalidatePath("/dashboard");
}