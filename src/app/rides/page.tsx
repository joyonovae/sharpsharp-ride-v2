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
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Available Rides
            </h1>

            <p className="mt-2 text-sm text-white/70">
              Find and book available rides near you.
            </p>

            {hasFilters && (
              <p className="mt-3 text-sm text-emerald-300">
                Showing results {from ? `from ${from} ` : ""}
                {to ? `to ${to} ` : ""}
                {date ? `on ${date}` : ""}
              </p>
            )}
          </div>

          {hasFilters && (
            <Link
              href="/rides"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-emerald-400 hover:text-emerald-400"
            >
              Clear Search
            </Link>
          )}
        </div>

        {!rides || rides.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No rides found for this search.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride: Ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#18c37e]/40"
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