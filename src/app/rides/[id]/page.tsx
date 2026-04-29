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

  // NEW FIELDS
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  plate_number: string | null;
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
    <section className="px-5 py-10 lg:px-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* MAIN RIDE CARD */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-semibold">
            {ride.from_city} → {ride.to_city}
          </h1>

          <p className="mt-3 text-white/70">
            {ride.travel_date} • {ride.travel_time}
          </p>

          <p className="mt-4 text-white/70">
            Pickup: {ride.pickup_point ?? "Not specified"}
          </p>

          <p className="mt-2 text-white/70">
            Seats left: {ride.available_seats}
          </p>

          <p className="mt-4 text-xl font-semibold text-[#18c37e]">
            ₦{ride.price_per_seat}
          </p>

          {ride.trip_notes && (
            <div className="mt-6">
              <p className="font-semibold">Notes:</p>
              <p className="mt-2 text-white/80">{ride.trip_notes}</p>
            </div>
          )}
        </div>

        {/* DRIVER + VEHICLE */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Driver & Vehicle Details
          </h2>

          <div className="space-y-2 text-white/80">
            <p>
              <span className="font-semibold text-white">Driver:</span>{" "}
              {ride.driver_name ?? "Not provided"}
            </p>

            <p>
              <span className="font-semibold text-white">Phone:</span>{" "}
              {ride.driver_phone ?? "Not provided"}
            </p>

            <div className="mt-3">
              <p className="font-semibold text-white">Vehicle</p>
              <p className="text-white/70">
                {ride.vehicle_brand ?? ""} {ride.vehicle_model ?? ""}
                {ride.vehicle_color ? ` (${ride.vehicle_color})` : ""}
              </p>
            </div>

            <p>
              <span className="font-semibold text-white">Plate Number:</span>{" "}
              {ride.plate_number ?? "Not provided"}
            </p>
          </div>
        </div>

        {/* LOGIN NOTICE */}
        {!user && (
          <div className="rounded-2xl border border-[#18c37e]/20 bg-[#18c37e]/10 p-4 text-sm text-white/80">
            You can browse rides without logging in. Login is only required when
            you want to book a ride.
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-4">
          <Link
            href="/rides"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold hover:border-[#18c37e]/40"
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
    </section>
  );
}