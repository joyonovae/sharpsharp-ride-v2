import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Car,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Route,
  ShieldCheck,
  User,
  Users,
  WalletCards,
} from "lucide-react";

function getStatusColor(status?: string | null) {
  if (status === "approved") return "text-emerald-400";
  if (status === "rejected") return "text-red-400";
  return "text-yellow-400";
}

function getRequestStatusStyle(status?: string | null) {
  if (status === "matched")
    return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  if (status === "assigned")
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "border-white/20 bg-white/10 text-white";
  if (status === "cancelled")
    return "border-red-400/30 bg-red-500/10 text-red-300";
  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
}

type AssignedRide = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  price_per_seat: number;
  pickup_point: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  plate_number: string | null;
};

type RideRequest = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  preferred_time: string | null;
  passenger_count: number;
  pickup_point: string | null;
  dropoff_point: string | null;
  status: string;
  created_at: string;
  assigned_ride_id: string | null;
  assigned_at: string | null;
  assigned_ride?: AssignedRide | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#061116] px-5 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-black">Please login first</h1>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: application } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: rideRequests } = await supabase
    .from("ride_requests")
    .select(
      `
      id,
      from_city,
      to_city,
      travel_date,
      preferred_time,
      passenger_count,
      pickup_point,
      dropoff_point,
      status,
      created_at,
      assigned_ride_id,
      assigned_at,
      assigned_ride:rides(
        id,
        from_city,
        to_city,
        travel_date,
        travel_time,
        price_per_seat,
        pickup_point,
        driver_name,
        driver_phone,
        vehicle_brand,
        vehicle_model,
        vehicle_color,
        plate_number
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const requests = (rideRequests || []) as RideRequest[];
  const assignedRequests = requests.filter(
    (request) => request.status === "assigned" && request.assigned_ride
  );

  return (
    <main className="w-full overflow-x-hidden bg-[#061116] px-4 py-10 text-white sm:px-5 lg:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-5 sm:p-7 md:p-10">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
                Dashboard
              </p>

              <h1 className="mt-4 break-words text-[2.25rem] font-black leading-tight sm:text-5xl">
                Welcome back, {profile?.full_name || "User"} 👋
              </h1>

              <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-slate-300 sm:text-base">
                Manage your rides, requests, bookings, profile, and driver
                application from one simple place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/request-ride"
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-[#04130c] transition hover:bg-emerald-400 sm:px-7 sm:py-4"
                >
                  Request a Ride
                </Link>

                <Link
                  href="/rides"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold transition hover:border-emerald-400 hover:text-emerald-400 sm:px-7 sm:py-4"
                >
                  Browse Rides
                </Link>
              </div>
            </div>

            <div className="min-w-0 rounded-[1.7rem] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <User className="h-7 w-7" />
              </div>

              <h2 className="mt-5 break-words text-2xl font-black">
                Account Summary
              </h2>

              <div className="mt-5 grid min-w-0 gap-3">
                <Info label="Email" value={user.email || "—"} />
                <Info label="Phone" value={profile?.phone || "Not set"} />
                <Info label="Role" value={profile?.role || "passenger"} />
              </div>
            </div>
          </div>
        </section>

        {assignedRequests.length > 0 && (
          <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
              Assigned Ride
            </p>

            <h2 className="mt-2 break-words text-3xl font-black">
              Your confirmed trip details
            </h2>

            <div className="mt-6 grid gap-5">
              {assignedRequests.map((request) => {
                const ride = request.assigned_ride;

                return (
                  <div
                    key={request.id}
                    className="rounded-[1.7rem] border border-emerald-400/20 bg-[#061116]/70 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-2xl font-black">
                          {ride?.from_city} → {ride?.to_city}
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          {ride?.travel_date} • {ride?.travel_time}
                        </p>

                        <p className="mt-2 text-sm text-emerald-300">
                          Assigned for {request.passenger_count} passenger
                          {request.passenger_count > 1 ? "s" : ""}
                        </p>
                      </div>

                      <span className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Assigned
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Driver" value={ride?.driver_name || "—"} />
                      <Info
                        label="Driver Phone"
                        value={ride?.driver_phone || "—"}
                      />
                      <Info
                        label="Vehicle"
                        value={`${ride?.vehicle_color || ""} ${
                          ride?.vehicle_brand || ""
                        } ${ride?.vehicle_model || ""}`}
                      />
                      <Info label="Plate Number" value={ride?.plate_number || "—"} />
                      <Info
                        label="Pickup Point"
                        value={ride?.pickup_point || request.pickup_point || "—"}
                      />
                      <Info
                        label="Price Per Seat"
                        value={ride?.price_per_seat ? `₦${ride.price_per_seat}` : "—"}
                      />
                      <Info
                        label="Request ID"
                        value={request.id.slice(0, 8)}
                      />
                      <Info
                        label="Assigned On"
                        value={
                          request.assigned_at
                            ? new Date(request.assigned_at).toLocaleDateString()
                            : "—"
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
            Find or Request a Trip
          </p>

          <h2 className="mt-2 break-words text-3xl font-black">
            How are you travelling today?
          </h2>

          <div className="mt-6 grid gap-3 rounded-[1.7rem] border border-white/10 bg-white/5 p-4 sm:p-5 md:grid-cols-[1fr_1fr_1fr_0.8fr_auto] md:items-end">
            <SearchBox label="From" placeholder="e.g. Abuja" />
            <SearchBox label="To" placeholder="e.g. Lagos" />
            <SearchBox label="Date" placeholder="Today" />
            <SearchBox label="Passengers" placeholder="1 passenger" />

            <Link
              href="/request-ride"
              className="flex h-14 items-center justify-center rounded-2xl bg-emerald-500 px-6 font-black text-[#04130c] transition hover:bg-emerald-400"
            >
              Request
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
                Ride Requests
              </p>
              <h2 className="mt-2 break-words text-3xl font-black">
                Your recent ride requests
              </h2>
            </div>

            <Link
              href="/request-ride"
              className="inline-flex justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-bold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              New Request
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <Route className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-black">No ride requests yet</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Request a ride when you don’t see an available trip. SharpSharp
                Ride can later match passengers by route and travel date.
              </p>
              <Link
                href="/request-ride"
                className="mt-5 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Request Your First Ride
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="min-w-0 rounded-[1.7rem] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-xl font-black">
                        {request.from_city} → {request.to_city}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {request.travel_date}
                        {request.preferred_time
                          ? ` • ${request.preferred_time}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getRequestStatusStyle(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info
                      label="Passengers"
                      value={`${request.passenger_count} passenger${
                        request.passenger_count > 1 ? "s" : ""
                      }`}
                    />
                    <Info label="Request ID" value={request.id.slice(0, 8)} />
                  </div>

                  {(request.pickup_point || request.dropoff_point) && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <p className="break-words">
                          {request.pickup_point || "Pickup not set"} →{" "}
                          {request.dropoff_point || "Dropoff not set"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
              Quick Actions
            </p>
            <h2 className="mt-2 break-words text-3xl font-black">
              What would you like to do?
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              href="/request-ride"
              icon={<Route className="h-6 w-6" />}
              title="Request a Ride"
              desc="Submit your route and let us match or assign a driver."
            />

            <ActionCard
              href="/dashboard/bookings"
              icon={<FileText className="h-6 w-6" />}
              title="My Bookings"
              desc="View your booking records and payment status."
            />

            <ActionCard
              href="/rent"
              icon={<WalletCards className="h-6 w-6" />}
              title="Rent a Car"
              desc="Browse available rental cars when listed."
            />

            <ActionCard
              href="/delivery"
              icon={<Package className="h-6 w-6" />}
              title="Delivery"
              desc="Delivery enquiries and updates."
            />
          </div>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
            Trust & Safety
          </p>

          <h2 className="mt-2 break-words text-3xl font-black">
            Travel with confidence
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <TrustCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Verified Drivers"
              desc="We review driver applications, vehicle details, and approval status before drivers can offer rides."
            />

            <TrustCard
              icon={<Users className="h-6 w-6" />}
              title="Know who you ride with"
              desc="View driver details, vehicle information, and profile pages before booking your trip."
            />

            <TrustCard
              icon={<WalletCards className="h-6 w-6" />}
              title="Secure Payments"
              desc="Bookings are processed securely and your ride is confirmed only after payment verification."
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400 sm:text-sm sm:tracking-[0.28em]">
                Driver Application
              </p>

              <h2 className="mt-3 break-words text-3xl font-black">
                {application ? "Your driver application" : "Become a driver"}
              </h2>

              {!application ? (
                <p className="mt-3 max-w-2xl break-words text-slate-300">
                  Apply to become a verified SharpSharp Ride driver and start
                  offering rides after approval.
                </p>
              ) : (
                <p className="mt-3 max-w-2xl break-words text-slate-300">
                  Your application is currently marked as{" "}
                  <span
                    className={`font-bold ${getStatusColor(
                      application.status
                    )}`}
                  >
                    {application.status}
                  </span>
                  .
                </p>
              )}
            </div>

            {!application ? (
              <Link
                href="/apply/driver"
                className="inline-flex justify-center rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Apply as Driver
              </Link>
            ) : application.status === "approved" ? (
              <Link
                href="/offer-a-ride/create"
                className="inline-flex justify-center rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Create Ride
              </Link>
            ) : application.status === "rejected" ? (
              <Link
                href="/apply/driver"
                className="inline-flex justify-center rounded-full bg-red-500 px-7 py-4 font-bold text-white"
              >
                Reapply
              </Link>
            ) : (
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-5 py-3 font-bold text-yellow-300">
                <Clock className="h-5 w-5" />
                Under Review
              </div>
            )}
          </div>

          {application && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Status" value={application.status} />
              <Info
                label="Vehicle"
                value={`${application.vehicle_brand || ""} ${
                  application.vehicle_model || ""
                }`}
              />
              <Info
                label="Plate Number"
                value={application.plate_number || "—"}
              />
              <Info label="Seats" value={application.seat_count || "—"} />
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[#04130c]">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h3 className="break-words text-xl font-black">
                  Your account is active
                </h3>
                <p className="mt-1 break-words text-sm leading-6 text-slate-300">
                  You can request rides, book available rides, manage bookings,
                  update your profile, and track your driver application status.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-white/15 px-6 py-3 text-center font-bold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              View Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-all font-bold text-white sm:break-words">
        {value ? String(value) : "—"}
      </p>
    </div>
  );
}

function SearchBox({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-bold text-white/80">{placeholder}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-2 hover:border-emerald-400/50 hover:bg-white/10"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
        {icon}
      </div>

      <h3 className="mt-5 break-words text-xl font-black">{title}</h3>
      <p className="mt-2 break-words text-sm leading-6 text-slate-400">
        {desc}
      </p>
    </Link>
  );
}

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.7rem] border border-white/10 bg-white/5 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
        {icon}
      </div>
      <h3 className="mt-5 break-words text-xl font-black text-emerald-400">
        {title}
      </h3>
      <p className="mt-3 break-words text-sm leading-6 text-slate-300">
        {desc}
      </p>
    </div>
  );
}