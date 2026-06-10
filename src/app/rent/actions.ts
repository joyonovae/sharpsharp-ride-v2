"use server";

import { redirect } from "next/navigation";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";
import { createNotification } from "@/lib/notifications/createNotification";
import { rentalApplicationTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendEmail";
import { createClient } from "@/lib/supabase/server";
import { requireActiveAccount } from "@/lib/account/requireActiveAccount";

export async function submitRentalVehicleApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rent/submit");
  await requireActiveAccount(user.id);

  const image = formData.get("image");
  if (!(image instanceof File) || !image.size) throw new Error("Vehicle image is required");
  if (image.size > 8 * 1024 * 1024) throw new Error("Vehicle image must be under 8MB");
  if (!image.type.startsWith("image/")) throw new Error("Vehicle upload must be an image");

  const extension = image.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const path = `rental-applications/${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("vehicle-images").upload(path, image, { upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(path);

  const payload = {
    user_id: user.id,
    owner_name: String(formData.get("owner_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    vehicle_type: String(formData.get("vehicle_type") || "").trim(),
    brand: String(formData.get("brand") || "").trim(),
    model: String(formData.get("model") || "").trim(),
    vehicle_year: Number(formData.get("vehicle_year")) || null,
    color: String(formData.get("color") || "").trim() || null,
    plate_number: String(formData.get("plate_number") || "").trim(),
    seats: Number(formData.get("seats")),
    price_per_day: Number(formData.get("price_per_day")),
    transmission: String(formData.get("transmission") || "").trim() || null,
    fuel_type: String(formData.get("fuel_type") || "").trim() || null,
    image_url: publicUrl.publicUrl,
    notes: String(formData.get("notes") || "").trim() || null,
    status: "pending",
  };

  if (!payload.owner_name || !payload.phone || !payload.location || !payload.vehicle_type || !payload.brand || !payload.model || !payload.plate_number || payload.seats < 1 || payload.price_per_day <= 0) {
    throw new Error("Please complete all required fields");
  }

  const { data: application, error } = await supabase.from("rental_vehicle_applications").insert(payload).select("id").single();
  if (error || !application) throw new Error(error?.message || "Could not submit rental application");

  await createNotification({
    userId: user.id,
    title: "Rental Vehicle Application Received",
    message: `Your ${payload.brand} ${payload.model} was submitted for review.`,
    type: "rental_application",
    link: "/dashboard/rentals",
    dedupeKey: `rental_application_submitted:${application.id}`,
  });

  if (user.email) {
    const template = rentalApplicationTemplate({
      name: payload.owner_name,
      status: "submitted",
      vehicle: `${payload.brand} ${payload.model}`,
    });
    const result = await sendEmail({ to: user.email, subject: template.subject, html: template.html });
    if (!result.success) console.error("Rental submission email failed:", result.error);
  }

  await notifyAdmins({
    title: "New rental vehicle application",
    message: `${payload.owner_name} submitted a ${payload.brand} ${payload.model} for rental review.`,
    type: "admin_rental_application",
    link: "/admin/rental-applications",
    dedupeKey: `admin_rental_application:${application.id}`,
  });

  redirect("/dashboard/rentals");
}
