import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RentalBooking = {
  id: string; user_id: string; owner_user_id: string | null; full_name: string;
  start_date: string; end_date: string; rental_days: number; booking_status: string;
  payment_status: string; pickup_location: string; total_amount: number;
  vehicles: { name: string | null; brand: string | null; model: string | null } | Array<{ name: string | null; brand: string | null; model: string | null }> | null;
};

export default async function RentalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/rentals");
  const [{ data: applications }, { data: bookings }] = await Promise.all([
    supabase.from("rental_vehicle_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("rental_bookings").select("*, vehicles(name, brand, model)").order("created_at", { ascending: false }),
  ]);
  const renterBookings = (bookings || []).filter((booking) => booking.user_id === user.id);
  const ownerBookings = (bookings || []).filter((booking) => booking.owner_user_id === user.id && booking.user_id !== user.id);
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-6xl space-y-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Rental Dashboard</p><h1 className="mt-3 text-3xl font-black">Rental Bookings and Vehicles</h1></div><div className="flex gap-3"><Link href="/rent" className="rounded-full border border-white/15 px-5 py-3 font-bold">Browse Rentals</Link><Link href="/rent/submit" className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Submit Vehicle</Link></div></div>
    <Section title="My Rental Bookings" empty="You have not booked a rental vehicle yet.">{renterBookings.map((booking) => <Booking key={booking.id} booking={booking}/>)}</Section>
    {ownerBookings.length > 0 && <Section title="Bookings for My Vehicles" empty="">{ownerBookings.map((booking) => <Booking key={booking.id} booking={booking} owner/>)}</Section>}
    <Section title="My Vehicle Applications" empty="No rental vehicle applications yet.">{(applications || []).map((app) => <article key={app.id} className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex justify-between gap-4"><h3 className="text-xl font-black">{app.brand} {app.model}</h3><Status value={app.status}/></div><p className="mt-2 text-slate-400">{app.location} | NGN {Number(app.price_per_day).toLocaleString()}/day</p>{app.admin_note && <p className="mt-3 text-sm text-white/70">{app.admin_note}</p>}</article>)}</Section>
  </div></main>;
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) { return <section><h2 className="text-2xl font-black">{title}</h2><div className="mt-5 grid gap-4">{children.length ? children : <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-slate-400">{empty}</div>}</div></section>; }
function Booking({ booking, owner = false }: { booking: RentalBooking; owner?: boolean }) {
  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
  return <article className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-black">{vehicle?.name || `${vehicle?.brand || ""} ${vehicle?.model || ""}`}</h3><p className="mt-2 text-slate-400">{booking.start_date} to {booking.end_date} · {booking.rental_days} day(s)</p></div><Status value={booking.booking_status}/></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label={owner ? "Renter" : "Payment"} value={owner ? booking.full_name : booking.payment_status}/><Info label="Pickup" value={booking.pickup_location}/><Info label="Total" value={`NGN ${Number(booking.total_amount).toLocaleString()}`}/></div></article>;
}
function Status({ value }: { value: string }) { return <span className="h-fit rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase text-emerald-300">{value}</span>; }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-bold">{String(value || "Not provided")}</p></div>; }
