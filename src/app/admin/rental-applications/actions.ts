"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { rentalApplicationTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendEmail";

type RentalApplication = {
  id: string;
  user_id: string;
  owner_name: string;
  brand: string;
  model: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return createAdminClient();
}

async function notifyOwner(application: RentalApplication, status: "approved" | "rejected", note: string) {
  const vehicle = `${application.brand} ${application.model}`;
  await createNotification({
    userId: application.user_id,
    title: status === "approved" ? "Rental Vehicle Approved" : "Rental Vehicle Application Update",
    message: status === "approved" ? `${vehicle} is now published in rental inventory.` : `${vehicle} was not approved.`,
    type: "rental_application",
    link: "/dashboard/rentals",
    dedupeKey: `rental_application_${status}:${application.id}`,
  });
  const email = await getAuthUserEmail(application.user_id);
  if (!email) return;
  const template = rentalApplicationTemplate({ name: application.owner_name, status, vehicle, note });
  const result = await sendEmail({ to: email, subject: template.subject, html: template.html });
  if (!result.success) console.error(`Rental ${status} email failed:`, result.error);
}

export async function approveRentalApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("applicationId") || "");
  const note = String(formData.get("adminNote") || "").trim();
  const { data: app, error } = await admin.from("rental_vehicle_applications").select("*").eq("id", id).single();
  if (error || !app) throw new Error(error?.message || "Application not found");
  if (app.status !== "pending") return;

  const { data: vehicle, error: vehicleError } = await admin.from("vehicles").insert({
    name: `${app.brand} ${app.model}${app.vehicle_year ? ` ${app.vehicle_year}` : ""}`,
    brand: app.brand,
    model: app.model,
    vehicle_type: app.vehicle_type,
    price_per_day: app.price_per_day,
    location: app.location,
    seats: app.seats,
    transmission: app.transmission || "Not specified",
    fuel_type: app.fuel_type || "Not specified",
    description: app.notes || `Approved rental vehicle submitted by ${app.owner_name}.`,
    car_image_url: app.image_url,
    is_available: true,
  }).select("id").single();
  if (vehicleError || !vehicle) throw new Error(vehicleError?.message || "Could not publish vehicle");

  const { error: updateError } = await admin.from("rental_vehicle_applications").update({
    status: "approved",
    admin_note: note || "Approved for rental inventory.",
    published_vehicle_id: vehicle.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "pending");
  if (updateError) throw new Error(updateError.message);
  await notifyOwner(app, "approved", note);
  revalidatePath("/admin/rental-applications");
  revalidatePath("/rent");
  revalidatePath("/dashboard/rentals");
}

export async function rejectRentalApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("applicationId") || "");
  const note = String(formData.get("adminNote") || "").trim();
  const { data: app, error } = await admin.from("rental_vehicle_applications").select("*").eq("id", id).single();
  if (error || !app) throw new Error(error?.message || "Application not found");
  if (app.status !== "pending") return;
  const { error: updateError } = await admin.from("rental_vehicle_applications").update({
    status: "rejected",
    admin_note: note || "Not approved at this time.",
    reviewed_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "pending");
  if (updateError) throw new Error(updateError.message);
  await notifyOwner(app, "rejected", note);
  revalidatePath("/admin/rental-applications");
  revalidatePath("/dashboard/rentals");
}
