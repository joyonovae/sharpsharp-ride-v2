"use server";

import { createClient } from "@/lib/supabase/server";

export async function approveDriver(formData: FormData) {
  const supabase = await createClient();

  const appId = formData.get("appId") as string;
  const userId = formData.get("userId") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔒 DOUBLE SECURITY
  if (!user || user.email !== "onovaejoy4@gmail.com") {
    throw new Error("Not authorized");
  }

  // ✅ Update application
  await supabase
    .from("driver_applications")
    .update({ status: "approved" })
    .eq("id", appId);

  // ✅ Update profile role
  await supabase
    .from("profiles")
    .update({
      role: "driver",
      driver_status: "approved",
    })
    .eq("id", userId);
}