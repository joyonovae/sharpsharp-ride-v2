import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignRideToRequest } from "../actions";
import {
  CalendarDays,
  Car,
  MapPin,
  Route,
  User,
  Users,
} from "lucide-react";

function getStatusStyle(status?: string | null) {
  if (status === "matched") {
    return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  }

  if (status === "assigned") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "completed") {
    return "border-white/20 bg-white/10 text-white";
  }

  if (status === "cancelled") {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
}

export default async function AdminRideRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: request } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: matchingRides } = await supabase
    .from("rides")
    .select("*")
    .ilike("from_city", `%${request.from_city}%`)
    .ilike("to_city", `%${request.to_city}%`)
    .eq("travel_date", request.travel_date)
    .gte("available_seats", request.passenger_count || 1)
    .order("created_at", { ascending: false });

  const { data: otherRides } = await supabase
    .from("rides")
    .select("*")
    .gte("available_seats", request.passenger_count || 1)
    .order("created_at", { ascending: false })
    .limit(8);

  const availableRides =
    matchingRides && matchingRides.length > 0 ? matchingRides : otherRides || [];

  const createRideHref = `/admin/rides/new?from=${encodeURIComponent(
    request.from_city || ""
  )}&to=${encodeURIComponent(
    request.to_city || ""
  )}&date=${encodeURIComponent(
    request.travel_date || ""
  )}&passengers=${encodeURIComponent(
    String(request.passenger_count || 1)
  )}&pickup=${encodeURIComponent(request.pickup_point || "")}`;

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/admin/ride-requests"
          className="inline-flex text-sm font-bold text-emerald-400 hover:text-emerald-300"
        >
          ← Back to ride requests
        </Link>

        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
                Assign Ride
              </p>

              <h1 className="mt-4 break-words text-4xl font-black">
                {request.from_city} → {request.to_city}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Assign this passenger request to an existing ride. Matching
                rides are shown first when available.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider ${getStatusStyle(
                request.status
              )}`}
            >
              {request.status}
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">Request Details</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<User className="h-5 w-5" />}
                label="Passenger"
                value={request.full_name || "—"}
              />
              <InfoCard
                icon={<User className="h-5 w-5" />}
                label="Phone"
                value={request.phone || "—"}
              />
              <InfoCard
                icon={<Users className="h-5 w-5" />}
                label="Passengers"
                value={`${request.passenger_count || 1}`}
              />
              <InfoCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="Travel Date"
                value={request.travel_date}
              />
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                label="Pickup"
                value={request.pickup_point || "Not specified"}
              />
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                label="Dropoff"
                value={request.dropoff_point || "Not specified"}
              />
            </div>

            {request.trip_notes && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Trip Notes
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {request.trip_notes}
                </p>
              </div>
            )}

            {request.assigned_ride_id && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-widest text-emerald-300">
                  Assigned Ride
                </p>

                <p className="mt-2 break-all text-sm font-bold text-white">
                  {request.assigned_ride_id}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Available Rides</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Choose a ride to assign this passenger request.
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                {availableRides.length} ride
                {availableRides.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-6 mt-6 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">
                    Need to create a ride first?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Create an operational ride using this passenger demand and
                    then assign this request to it.
                  </p>
                </div>

                <Link
                  href={createRideHref}
                  className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400"
                >
                  Create Ride for This Request
                </Link>
              </div>
            </div>

            {availableRides.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                  <Route className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-black">
                  No available ride yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  There is no ride with enough seats available right now. Create
                  or wait for a matching driver ride before assigning.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableRides.map((ride: any) => (
                  <div
                    key={ride.id}
                    className="rounded-[1.5rem] border border-white/10 bg-[#061116]/60 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="break-words text-xl font-black">
                          {ride.from_city} → {ride.to_city}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          {ride.travel_date} • {ride.travel_time}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Seats left: {ride.available_seats}
                        </p>

                        <p className="mt-2 text-sm text-emerald-400">
                          ₦{ride.price_per_seat}
                        </p>
                      </div>

                      <form action={assignRideToRequest}>
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />
                        <input type="hidden" name="rideId" value={ride.id} />
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400 md:w-auto">
                          <Car className="h-5 w-5" />
                          Assign
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: unknown;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-emerald-400">
        {icon}
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words font-bold text-white">
        {value ? String(value) : "—"}
      </p>
    </div>
  );
}
