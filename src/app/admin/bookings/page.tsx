import Link from "next/link";
import { completeTrip } from "@/app/actions/completeTrip";
import { requireAdminPage } from "@/lib/admin/requireAdmin";

export default async function AdminBookingsPage() {
  const { admin } = await requireAdminPage();
  const { data: bookings } = await admin
    .from("ride_bookings")
    .select("id, ride_id, full_name, phone, seats_booked, total_amount, payment_status, trip_status, created_at, rides(from_city, to_city, travel_date, travel_time, driver_name)")
    .order("created_at", { ascending: false });

  const paid = (bookings || []).filter((booking) => booking.payment_status === "paid");
  const revenue = paid.reduce((total, booking) => total + Number(booking.total_amount || 0), 0);
  const openRideIds = Array.from(new Set(paid.filter((booking) => booking.trip_status !== "completed").map((booking) => booking.ride_id)));

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/admin" className="text-sm font-bold text-emerald-400">Back to admin</Link>
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Bookings and Revenue</p>
          <h1 className="mt-4 text-4xl font-black">Paid Bookings</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Paid Bookings" value={paid.length} />
            <Metric label="Total Revenue" value={`NGN ${revenue.toLocaleString()}`} />
            <Metric label="Open Trips" value={openRideIds.length} />
          </div>
        </section>

        {openRideIds.length > 0 && (
          <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
            <h2 className="text-2xl font-black">Trip Completion</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {openRideIds.map((rideId) => (
                <form key={rideId} action={completeTrip}>
                  <input type="hidden" name="rideId" value={rideId} />
                  <button className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-[#04130c]">
                    Complete Ride {rideId.slice(0, 8)}
                  </button>
                </form>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4">
          {(bookings || []).map((booking) => {
            const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
            return (
              <div key={booking.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{booking.full_name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{ride?.from_city} to {ride?.to_city} · {ride?.travel_date}</p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase text-emerald-300">
                    {booking.trip_status || "booked"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Info label="Phone" value={booking.phone} />
                  <Info label="Seats" value={booking.seats_booked} />
                  <Info label="Amount" value={`NGN ${booking.total_amount}`} />
                  <Info label="Driver" value={ride?.driver_name} />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-emerald-400">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 break-words font-bold">{value ? String(value) : "Not provided"}</p></div>;
}
