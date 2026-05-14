import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  MapPin,
  Route,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { markRideRequestMatched, cancelRideRequest } from "./actions";

function getStatusStyle(status?: string | null) {
  if (status === "matched") return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  if (status === "assigned") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "border-white/20 bg-white/10 text-white";
  if (status === "cancelled") return "border-red-400/30 bg-red-500/10 text-red-300";
  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
}

type RideRequest = {
  id: string;
  full_name: string | null;
  phone: string | null;
  from_city: string;
  to_city: string;
  travel_date: string;
  preferred_time: string | null;
  passenger_count: number;
  pickup_point: string | null;
  dropoff_point: string | null;
  trip_notes: string | null;
  status: string;
  created_at: string;
};

type GroupedRequest = {
  key: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  totalPassengers: number;
  requestCount: number;
  pendingCount: number;
};

function groupRideRequests(requests: RideRequest[]): GroupedRequest[] {
  const map = new Map<string, GroupedRequest>();

  for (const request of requests) {
    const key = `${request.from_city.toLowerCase().trim()}-${request.to_city
      .toLowerCase()
      .trim()}-${request.travel_date}`;

    const existing = map.get(key);

    if (existing) {
      existing.totalPassengers += Number(request.passenger_count || 0);
      existing.requestCount += 1;

      if (request.status === "pending") existing.pendingCount += 1;
    } else {
      map.set(key, {
        key,
        from_city: request.from_city,
        to_city: request.to_city,
        travel_date: request.travel_date,
        totalPassengers: Number(request.passenger_count || 0),
        requestCount: 1,
        pendingCount: request.status === "pending" ? 1 : 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.travel_date === b.travel_date) {
      return b.totalPassengers - a.totalPassengers;
    }
    return a.travel_date.localeCompare(b.travel_date);
  });
}

export default async function AdminRideRequestsPage() {
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

  const { data } = await supabase
    .from("ride_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const requests = (data || []) as RideRequest[];
  const groupedRequests = groupRideRequests(requests);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const matchedRequests = requests.filter((r) => r.status === "matched").length;
  const assignedRequests = requests.filter((r) => r.status === "assigned").length;

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
                Admin Panel
              </p>

              <h1 className="mt-4 text-4xl font-black">
                Ride Request Management
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Monitor passenger demand, group routes, and prepare ride
                assignments for SharpSharp Ride operations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Total Requests" value={totalRequests} />
              <StatCard title="Pending" value={pendingRequests} />
              <StatCard title="Assigned" value={assignedRequests} />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
                Grouped Passenger Demand
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Route and date clusters
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Requests are grouped automatically by departure city,
                destination city, and travel date.
              </p>
            </div>

            <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300">
              {groupedRequests.length} active group
              {groupedRequests.length === 1 ? "" : "s"}
            </div>
          </div>

          {groupedRequests.length === 0 ? (
            <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-6">
              <h3 className="text-xl font-black">No grouped demand yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Passenger groups will appear once ride requests are submitted.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {groupedRequests.map((group) => (
                <div
                  key={group.key}
                  className="rounded-[1.7rem] border border-white/10 bg-[#061116]/60 p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                    <Route className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 break-words text-2xl font-black">
                    {group.from_city} → {group.to_city}
                  </h3>

                  <div className="mt-5 grid gap-3">
                    <MiniInfo label="Travel Date" value={group.travel_date} />
                    <MiniInfo
                      label="Total Passengers"
                      value={`${group.totalPassengers}`}
                    />
                    <MiniInfo label="Requests" value={`${group.requestCount}`} />
                    <MiniInfo
                      label="Pending Requests"
                      value={`${group.pendingCount}`}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                    {group.totalPassengers >= 4
                      ? "This route has enough passenger demand to consider assigning a vehicle."
                      : "Demand is still building for this route."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
                Passenger Requests
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Incoming travel demand
              </h2>
            </div>

            <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300">
              {matchedRequests} matched requests
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <Route className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-2xl font-black">
                No ride requests yet
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Passenger ride requests will appear here once users begin
                submitting routes and travel dates.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="break-words text-2xl font-black">
                          {request.from_city} → {request.to_city}
                        </h3>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyle(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoCard
                          icon={<Users className="h-5 w-5" />}
                          label="Passengers"
                          value={`${request.passenger_count}`}
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

                      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                          Passenger Information
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-slate-400">Full Name</p>
                            <p className="font-bold text-white">
                              {request.full_name || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-400">Phone</p>
                            <p className="font-bold text-white">
                              {request.phone || "—"}
                            </p>
                          </div>
                        </div>
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
                    </div>

                    <div className="flex flex-col gap-3 lg:w-[220px]">
                      <Link
                        href={`/admin/ride-requests/${request.id}`}
                        className="rounded-2xl bg-emerald-500 px-5 py-4 text-center font-bold text-[#04130c] transition hover:bg-emerald-400"
                      >
                        Assign Ride
                      </Link>

                      {request.status === "pending" && (
                        <form action={markRideRequestMatched}>
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />

                          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-5 py-4 font-bold text-blue-300 transition hover:bg-blue-500/20">
                            <CheckCircle2 className="h-5 w-5" />
                            Mark Matched
                          </button>
                        </form>
                      )}

                      {request.status !== "cancelled" && (
                        <form action={cancelRideRequest}>
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />

                          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 font-bold text-red-300 transition hover:bg-red-500/20">
                            <XCircle className="h-5 w-5" />
                            Cancel Request
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-emerald-400">{value}</h3>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-black text-white">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-emerald-400">
        {icon}
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words font-bold text-white">{value}</p>
    </div>
  );
}