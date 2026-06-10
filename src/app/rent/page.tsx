import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RentPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Car Rentals</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Available Rental Vehicles</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Browse approved vehicles published by SharpSharp Ride.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/rent/submit" className="rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]">List Your Vehicle</Link>
            <Link href="/dashboard/rentals" className="rounded-full border border-white/15 px-6 py-3 font-bold">My Rental Applications</Link>
          </div>
        </section>

        {!vehicles?.length ? (
          <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8">
            <h2 className="text-2xl font-black">No rental vehicles available yet</h2>
            <p className="mt-3 text-slate-400">Approved rental vehicles will appear here when published.</p>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Link key={vehicle.id} href={`/rent/${vehicle.id}`} className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/5 transition hover:border-emerald-400/40">
                <img src={vehicle.car_image_url || "/images/car-placeholder.jpg"} alt={vehicle.name || "Rental vehicle"} className="h-52 w-full object-cover" />
                <div className="p-5">
                  <h2 className="text-xl font-black">{vehicle.name || `${vehicle.brand || ""} ${vehicle.model || ""}`}</h2>
                  <p className="mt-2 text-sm text-slate-400">{vehicle.location || "Location available on request"}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-black text-emerald-400">NGN {Number(vehicle.price_per_day || 0).toLocaleString()}/day</span>
                    <span className="text-sm text-white/60">{vehicle.seats || "-"} seats</span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
