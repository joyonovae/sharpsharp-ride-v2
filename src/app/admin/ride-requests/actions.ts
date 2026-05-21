"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  await supabase
    .from("ride_requests")
    .update({
      status: "matched",
      admin_note: "Passenger request has been matched by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/admin/ride-requests");
  revalidatePath("/dashboard");
}

export async function cancelRideRequest(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");

  if (!requestId) {
    throw new Error("Missing request ID");
  }

  await supabase
    .from("ride_requests")
    .update({
      status: "cancelled",
      admin_note: "Passenger request was cancelled by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

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

  revalidatePath("/admin/ride-requests");
  revalidatePath(`/admin/ride-requests/${requestId}`);
  revalidatePath("/rides");
  revalidatePath("/dashboard");
}