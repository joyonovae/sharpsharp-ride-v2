"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitDriverApplication(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("driver_applications").insert({
    user_id: user.id,
    full_name: String(formData.get("full_name") || ""),
    phone: String(formData.get("phone") || ""),
    car_type: String(formData.get("car_type") || ""),
    plate_number: String(formData.get("plate_number") || ""),
    vehicle_color: String(formData.get("vehicle_color") || ""),
    status: "pending",
  });

  if (error) {
    redirect(`/dashboard/driver/apply?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}