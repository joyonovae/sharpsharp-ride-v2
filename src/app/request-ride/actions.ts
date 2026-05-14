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

  await supabase
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

  revalidatePath("/admin/ride-requests");
  revalidatePath(`/admin/ride-requests/${requestId}`);
  revalidatePath("/dashboard");
}