import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function maskPlate(value: string | null) {
  if (!value) return "Not provided";
  if (value.length < 5) return "***";
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: driver, error } = await supabase
    .from("driver_applications")
    .select("full_name, car_type, vehicle_brand, vehicle_model, vehicle_color, plate_number, seat_count, city, created_at")
    .eq("user_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !driver) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: reviews }, { data: rides }, { data: completed }] = await Promise.all([
    supabase.from("ride_reviews").select("id, rating, comment, created_at").eq("reviewee_id", id).eq("context", "driver").eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("rides").select("id, from_city, to_city, travel_date, travel_time, price_per_seat").eq("driver_id", id).gte("travel_date", today).order("travel_date").limit(6),
    supabase.from("ride_bookings").select("ride_id, rides!inner(driver_id)").eq("rides.driver_id", id).eq("payment_status", "paid").eq("trip_status", "completed"),
  ]);
  const average = reviews?.length ? (reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1) : "New";
  const completedTrips = new Set((completed || []).map((booking) => booking.ride_id)).size;

  return <main className="min-h-screen bg-[#061116] px-5 py-10 text-white lg:px-8"><div className="mx-auto max-w-5xl space-y-8">
    <section className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-4xl font-black">{(driver.full_name || "D")[0]}</div>
      <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Verified Driver</p><h1 className="mt-3 text-3xl font-black">{driver.full_name || "Approved Driver"}</h1><p className="mt-2 text-slate-400">{driver.city ? `Based in ${driver.city}` : "SharpSharp Ride approved driver"} · Active since {new Date(driver.created_at).toLocaleDateString()}</p></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3"><Stat label="Average Rating" value={average}/><Stat label="Reviews" value={String(reviews?.length || 0)}/><Stat label="Completed Trips" value={String(completedTrips)}/></section>

    <section><h2 className="text-2xl font-black">Approved Vehicle</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Vehicle Type" value={driver.car_type}/><Info label="Vehicle" value={`${driver.vehicle_brand || ""} ${driver.vehicle_model || ""}`.trim()}/><Info label="Color" value={driver.vehicle_color}/><Info label="Plate" value={maskPlate(driver.plate_number)}/><Info label="Seats" value={driver.seat_count}/></div></section>

    <section><h2 className="text-2xl font-black">Upcoming Rides</h2><div className="mt-5 grid gap-4">{!rides?.length ? <Empty text="No upcoming rides from this driver."/> : rides.map((ride) => <Link key={ride.id} href={`/rides/${ride.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40"><h3 className="text-xl font-black">{ride.from_city} to {ride.to_city}</h3><p className="mt-2 text-slate-400">{ride.travel_date} · {ride.travel_time} · NGN {Number(ride.price_per_seat).toLocaleString()}/seat</p></Link>)}</div></section>

    <section><h2 className="text-2xl font-black">Recent Reviews</h2><div className="mt-5 grid gap-4">{!reviews?.length ? <Empty text="This driver has no reviews yet."/> : reviews.slice(0, 8).map((review) => <article key={review.id} className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="font-black text-emerald-300">{review.rating}/5</p><p className="mt-2 text-slate-300">{review.comment || "Rating submitted without a comment."}</p><p className="mt-3 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p></article>)}</div></section>
  </div></main>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-emerald-400">{value}</p></div>;
}
function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-bold">{String(value || "Not provided")}</p></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-slate-400">{text}</div>;
}
