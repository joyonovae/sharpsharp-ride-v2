import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Ride = {
  id: string;
  driver_id: string | null;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  price_per_seat: number;
  available_seats: number;
  pickup_point: string | null;
  trip_notes: string | null;
};

type DriverApplication = {
  full_name: string | null;
  phone: string | null;
  car_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  plate_number: string | null;
  seat_count: number | null;
  vehicle_image_url: string | null;
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

  const { data: driverApp } = ride.driver_id
    ? await supabase
        .from("driver_applications")
        .select(
          "full_name, phone, car_type, vehicle_brand, vehicle_model, vehicle_color, plate_number, seat_count, vehicle_image_url"
        )
        .eq("user_id", ride.driver_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<DriverApplication>()
    : { data: null };

  const checkoutHref = `/checkout?type=ride&rideId=${ride.id}`;

  const bookRideHref = user
    ? checkoutHref
    : `/login?next=${encodeURIComponent(checkoutHref)}`;

  return (
    <section className="overflow-x-hidden px-5 py-10 text-white lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
          <h1 className="break-words text-3xl font-semibold md:text-4xl">
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

          <p className="mt-4 text-2xl font-black text-[#18c37e]">
            ₦{ride.price_per_seat}
          </p>

          {ride.trip_notes && (
            <div className="mt-6">
              <p className="font-semibold">Notes:</p>
              <p className="mt-2 text-white/80">{ride.trip_notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
          <h2 className="text-2xl font-black md:text-3xl">
            Driver & Vehicle Details
          </h2>

          {driverApp ? (
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/10">
                    <div className="flex h-full w-full items-center justify-center text-xl font-black text-white/60">
                      {(driverApp.full_name || "D").charAt(0)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/45">Driver</p>
                    <p className="font-bold text-white">
                      {driverApp.full_name || "Approved Driver"}
                    </p>
                    <p className="mt-1 text-xs text-[#18c37e]">
                      Approved Driver • Ratings coming soon
                    </p>
                  </div>
                </div>

                <Info label="Phone" value={driverApp.phone} />
                <Info label="Vehicle Type" value={driverApp.car_type} />

                <Info
                  label="Vehicle"
                  value={`${driverApp.vehicle_brand || ""} ${
                    driverApp.vehicle_model || ""
                  }`.trim()}
                />

                <Info label="Color" value={driverApp.vehicle_color} />
                <Info label="Plate Number" value={driverApp.plate_number} />
                <Info label="Total Seats" value={driverApp.seat_count} />

                {ride.driver_id && (
                  <Link
                    href={`/drivers/${ride.driver_id}`}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[#18c37e]/30 px-6 text-sm font-bold text-[#18c37e] hover:bg-[#18c37e]/10"
                  >
                    View Driver Profile
                  </Link>
                )}
              </div>

              {driverApp.vehicle_image_url ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img
                    src={driverApp.vehicle_image_url}
                    alt="Driver vehicle"
                    className="h-full min-h-72 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50">
                  No vehicle image
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-white/60">
              Driver details are not available yet.
            </p>
          )}
        </div>

        {!user && (
          <div className="rounded-2xl border border-[#18c37e]/20 bg-[#18c37e]/10 p-4 text-sm text-white/80">
            You can browse rides without logging in. Login is only required when
            you want to book a ride.
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
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

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 break-words font-bold text-white">
        {value ? String(value) : "Not provided"}
      </p>
    </div>
  );
}
