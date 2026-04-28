import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OfferRideEntryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?next=/offer-a-ride");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, driver_status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: application } = await supabase
    .from("driver_applications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const role = profile?.role;
  const profileDriverStatus = profile?.driver_status;
  const applicationStatus = application?.status;

  const isApproved =
    role === "admin" ||
    role === "driver" ||
    profileDriverStatus === "approved" ||
    applicationStatus === "approved";

  if (isApproved) {
    redirect("/offer-a-ride/create");
  }

  if (profileDriverStatus === "pending" || applicationStatus === "pending") {
    redirect("/apply/driver/review");
  }

  redirect("/apply/driver");
}