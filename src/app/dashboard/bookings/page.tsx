import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MyBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: bookings } = await supabase
    .from("ride_bookings")
    .select(
      `
      id,
      ride_id,
      full_name,
      phone,
      seats_booked,
      total_amount,
      booking_reference,
      payment_status,
      trip_status,
      completed_at,
      created_at,
      rides (
        from_city,
        to_city,
        travel_date,
        travel_time,
        pickup_point
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="px-4 py-10 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black">My Bookings</h1>
        <p className="mt-2 text-slate-300">
          View your ride booking history and payment status.
        </p>

        {!bookings || bookings.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-300">You have no bookings yet.</p>

            <Link
              href="/rides"
              className="mt-4 inline-block text-emerald-400 underline"
            >
              Browse rides →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {bookings.map((booking: any) => {
              const ride = Array.isArray(booking.rides)
                ? booking.rides[0]
                : booking.rides;

              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        {ride?.from_city || "Ride"} → {ride?.to_city || ""}
                      </h2>

                      <p className="mt-2 text-sm text-slate-300">
                        {ride?.travel_date || "Date not available"} •{" "}
                        {ride?.travel_time || "Time not available"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Pickup: {ride?.pickup_point || "Not specified"}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                      {booking.trip_status || booking.payment_status || "booked"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                    <Info label="Seats" value={booking.seats_booked} />
                    <Info label="Amount" value={`₦${booking.total_amount}`} />
                    <Info label="Reference" value={booking.booking_reference} />
                    <Info
                      label="Completed"
                      value={
                        booking.completed_at
                          ? new Date(booking.completed_at).toLocaleDateString()
                          : "Not yet"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-white">{value || "N/A"}</p>
    </div>
  );
}
