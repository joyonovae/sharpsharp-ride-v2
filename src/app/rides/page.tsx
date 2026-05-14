import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  price_per_seat: number;
  available_seats: number;
};

export default async function RidesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;

  const from = params?.from?.trim();
  const to = params?.to?.trim();
  const date = params?.date?.trim();

  const requestHref = `/request-ride?${new URLSearchParams({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(date ? { date } : {}),
  }).toString()}`;

  const supabase = await createClient();

  let query = supabase
    .from("rides")
    .select("*")
    .order("created_at", { ascending: false });

  if (from) {
    query = query.ilike("from_city", `%${from}%`);
  }

  if (to) {
    query = query.ilike("to_city", `%${to}%`);
  }

  if (date) {
    query = query.eq("travel_date", date);
  }

  const { data: rides, error } = await query;

  if (error) {
    console.error("Error fetching rides:", error.message);
  }

  const hasFilters = Boolean(from || to || date);

  return (
    <section className="min-h-screen bg-[#08141b] px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
              Book a Ride
            </p>

            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Available Rides
            </h1>

            <p className="mt-2 text-sm text-white/70">
              Find and book available rides. If your route is not available,
              submit a request and we’ll help match you.
            </p>

            {hasFilters && (
              <p className="mt-3 text-sm text-emerald-300">
                Showing results {from ? `from ${from} ` : ""}
                {to ? `to ${to} ` : ""}
                {date ? `on ${date}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {hasFilters && (
              <Link
                href="/rides"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-emerald-400 hover:text-emerald-400"
              >
                Clear Search
              </Link>
            )}

            <Link
              href={requestHref}
              className="rounded-full bg-[#18c37e] px-5 py-3 text-sm font-bold text-[#04130c] transition hover:bg-emerald-400"
            >
              Request a Ride
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-[1.7rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">
                Can’t find your route?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Submit a ride request and SharpSharp Ride can group you with
                other passengers travelling the same route.
              </p>
            </div>

            <Link
              href={requestHref}
              className="inline-flex justify-center rounded-full bg-[#18c37e] px-6 py-3 text-sm font-black text-[#04130c] transition hover:bg-emerald-400"
            >
              Request This Route
            </Link>
          </div>
        </div>

        {!rides || rides.length === 0 ? (
          <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-8 text-white">
            <h2 className="text-2xl font-black">No rides found</h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              No ride is currently available for this search. You can request
              this route and we’ll use it to match passengers or assign a driver
              later.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={requestHref}
                className="rounded-full bg-[#18c37e] px-6 py-3 text-sm font-black text-[#04130c] transition hover:bg-emerald-400"
              >
                Request Ride Instead
              </Link>

              <Link
                href="/rides"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:border-emerald-400 hover:text-emerald-400"
              >
                View All Rides
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride: Ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-[#18c37e]/40 hover:bg-white/10"
              >
                <p className="text-lg font-semibold text-white">
                  {ride.from_city} → {ride.to_city}
                </p>

                <p className="mt-2 text-sm text-white/70">
                  {ride.travel_date} • {ride.travel_time}
                </p>

                <p className="mt-3 text-sm text-white/70">
                  Seats left: {ride.available_seats}
                </p>

                <p className="mt-3 text-lg font-semibold text-[#18c37e]">
                  ₦{ride.price_per_seat}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}