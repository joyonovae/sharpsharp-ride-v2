"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return supabase;
}

export async function createAdminRide(formData: FormData) {
  const supabase = await requireAdmin();

  const driverApplicationId = String(formData.get("driverApplicationId") || "");
  const fromCity = String(formData.get("fromCity") || "");
  const toCity = String(formData.get("toCity") || "");
  const travelDate = String(formData.get("travelDate") || "");
  const travelTime = String(formData.get("travelTime") || "");
  const pricePerSeat = Number(formData.get("pricePerSeat") || 0);
  const availableSeats = Number(formData.get("availableSeats") || 0);
  const pickupPoint = String(formData.get("pickupPoint") || "");
  const tripNotes = String(formData.get("tripNotes") || "");

  if (
    !driverApplicationId ||
    !fromCity ||
    !toCity ||
    !travelDate ||
    !travelTime ||
    !pricePerSeat ||
    !availableSeats
  ) {
    throw new Error("Missing required ride details");
  }

  const { data: driverApp, error: driverError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("id", driverApplicationId)
    .eq("status", "approved")
    .single();

  if (driverError || !driverApp) {
    throw new Error("Approved driver not found");
  }

  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .insert({
      driver_id: driverApp.user_id,
      from_city: fromCity,
      to_city: toCity,
      travel_date: travelDate,
      travel_time: travelTime,
      price_per_seat: pricePerSeat,
      available_seats: availableSeats,
      pickup_point: pickupPoint,
      trip_notes: tripNotes,
      driver_name: driverApp.full_name,
      driver_phone: driverApp.phone,
      vehicle_brand: driverApp.vehicle_brand,
      vehicle_model: driverApp.vehicle_model,
      vehicle_color: driverApp.vehicle_color,
      plate_number: driverApp.plate_number,
    })
    .select("id")
    .single();

  if (rideError || !ride) {
    throw new Error(rideError?.message || "Failed to create ride");
  }

  redirect(`/admin/ride-requests`);
}