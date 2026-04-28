import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  price_per_seat: number;
  available_seats: number;
  pickup_point: string | null;
  trip_notes: string | null;
};

export default async function RideDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ride, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .single<Ride>();

  if (error || !ride) {
    return notFound();
  }

  const checkoutHref = `/checkout?type=ride&rideId=${ride.id}`;

  const bookRideHref = user
    ? checkoutHref
    : `/login?next=${encodeURIComponent(checkoutHref)}`;

  return (
    <section className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-semibold text-white">
            {ride.from_city} → {ride.to_city}
          </h1>

          <p className="mt-3 text-white/70">
            {ride.travel_date} • {ride.travel_time}
          </p>

          <p className="mt-4 text-white/70">
            Pickup: {ride.pickup_point ?? "Not specified"}
          </p>

          <p className="mt-4 text-white/70">
            Seats left: {ride.available_seats}
          </p>

          <p className="mt-4 text-xl font-semibold text-[#18c37e]">
            ₦{ride.price_per_seat}
          </p>

          {ride.trip_notes && (
            <div className="mt-6 text-white/80">
              <p className="font-semibold">Notes:</p>
              <p className="mt-2">{ride.trip_notes}</p>
            </div>
          )}

          {!user && (
            <div className="mt-6 rounded-2xl border border-[#18c37e]/20 bg-[#18c37e]/10 p-4 text-sm text-white/80">
              You can browse rides without logging in. Login is only required when
              you want to book a ride.
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Link
              href="/rides"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-white hover:border-[#18c37e]/40"
            >
              Back
            </Link>

            <Link
              href={bookRideHref}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#18c37e] px-6 text-sm font-semibold text-[#04130c] hover:brightness-105"
            >
              {user ? "Book Ride" : "Login to Book Ride"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}