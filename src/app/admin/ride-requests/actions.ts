// src/app/admin/ride-requests/actions.ts

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
    .select("id, user_id, from_city, to_city, travel_date")
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
      message: `Your ${request.from_city} → ${request.to_city} ride request for ${request.travel_date} has been matched. We will update you once a ride is assigned.`,
      type: "ride_request_matched",
      actionUrl: "/dashboard",
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
    .select("id, user_id, from_city, to_city, travel_date")
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
      message: `Your ${request.from_city} → ${request.to_city} ride request for ${request.travel_date} was cancelled. Please contact support if you need help.`,
      type: "ride_request_cancelled",
      actionUrl: "/dashboard",
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

  const { data: request, error: requestError } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error("Ride request not found");
  }

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

  if (availableSeats < passengersNeeded) {
    throw new Error("Not enough available seats");
  }

  const updatedSeats = availableSeats - passengersNeeded;

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

  const { error: rideUpdateError } = await supabase
    .from("rides")
    .update({
      available_seats: updatedSeats,
    })
    .eq("id", rideId);

  if (rideUpdateError) {
    throw new Error(rideUpdateError.message);
  }

  if (request.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Your ride has been assigned",
      message: `Your ${request.from_city} → ${request.to_city} ride request has been assigned. Driver: ${
        ride.driver_name || "Assigned driver"
      }. Vehicle: ${ride.vehicle_brand || ""} ${ride.vehicle_model || ""}.`,
      type: "ride_assigned",
      actionUrl: "/dashboard",
    });
  }

  if (driverId) {
    await createNotification({
      userId: driverId,
      title: "New passenger assigned",
      message: `${passengersNeeded} passenger${
        passengersNeeded > 1 ? "s have" : " has"
      } been assigned to your ${ride.from_city} → ${ride.to_city} ride.`,
      type: "passenger_assigned",
      actionUrl: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath(`/admin/ride-requests/${requestId}`);
  revalidatePath("/rides");
  revalidatePath("/dashboard");
}