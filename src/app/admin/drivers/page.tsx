import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/requireAdmin";

export default async function AdminDriversPage() {
  const { admin } = await requireAdminPage();
  const { data: drivers } = await admin
    .from("driver_applications")
    .select("id, user_id, full_name, phone, status, vehicle_brand, vehicle_model, vehicle_color, plate_number, seat_count, city")
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  const driverIds = (drivers || []).map((driver) => driver.user_id).filter(Boolean);
  const [{ data: rides }, { data: bookings }] = await Promise.all([
    driverIds.length
      ? admin.from("rides").select("id, driver_id").in("driver_id", driverIds)
      : Promise.resolve({ data: [] }),
    driverIds.length
      ? admin
          .from("ride_bookings")
          .select("id, seats_booked, rides!inner(driver_id)")
          .in("rides.driver_id", driverIds)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/admin" className="text-sm font-bold text-emerald-400">Back to admin</Link>
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Driver Management</p>
          <h1 className="mt-4 text-4xl font-black">Approved Drivers</h1>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {(drivers || []).map((driver) => {
            const rideCount = (rides || []).filter((ride) => ride.driver_id === driver.user_id).length;
            const passengerCount = (bookings || [])
              .filter((booking) => {
                const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
                return ride?.driver_id === driver.user_id;
              })
              .reduce((total, booking) => total + Number(booking.seats_booked || 0), 0);

            return (
              <div key={driver.id} className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-black">{driver.full_name}</h2>
                <p className="mt-2 text-sm text-slate-400">{driver.phone || "No phone"} · {driver.city || "No city"}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Info label="Vehicle" value={`${driver.vehicle_color || ""} ${driver.vehicle_brand || ""} ${driver.vehicle_model || ""}`.trim()} />
                  <Info label="Plate" value={driver.plate_number} />
                  <Info label="Seats" value={driver.seat_count} />
                  <Info label="Created Rides" value={rideCount} />
                  <Info label="Booked Passengers" value={passengerCount} />
                  <Info label="Status" value={driver.status} />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 break-words font-bold">{value ? String(value) : "Not provided"}</p></div>;
}
