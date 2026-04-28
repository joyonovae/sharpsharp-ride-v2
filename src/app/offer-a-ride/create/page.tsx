import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RideCreateForm from "./ride-create-form";

export default async function CreateRidePage() {
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

  const isApproved =
    profile?.role === "admin" ||
    profile?.role === "driver" ||
    profile?.driver_status === "approved" ||
    application?.status === "approved";

  if (!isApproved) {
    redirect("/offer-a-ride");
  }

  return <RideCreateForm userId={user.id} />;
}