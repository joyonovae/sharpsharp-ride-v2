import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RentalCheckoutClient from "./RentalCheckoutClient";

export default async function RentalCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/rent/${id}/checkout`)}`);
  const { data: vehicle } = await supabase.from("vehicles").select("id, name, brand, model, location, price_per_day, car_image_url, is_available").eq("id", id).eq("is_available", true).single();
  if (!vehicle) notFound();
  return <RentalCheckoutClient vehicle={vehicle} userEmail={user.email || ""} userId={user.id} />;
}
