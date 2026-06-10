import Link from "next/link";
import { redirect } from "next/navigation";
import { Car, CheckCircle2, Route, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { completeTrip } from "@/app/actions/completeTrip";
import { ReviewForm } from "@/components/reviews/ReviewForm";

type DriverRide = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  available_seats: number;
  price_per_seat: number;
  pickup_point: string | null;
};

type RideBooking = {
  id: string;
  ride_id: string;
  full_name: string;
  phone: string;
  seats_booked: number;
  payment_status: string;
  total_amount: number;
  trip_status: string;
};

type AssignedRequest = {
  id: string;
  full_name: string | null;
  phone: string | null;
  from_city: string;
  to_city: string;
  travel_date: string;
  passenger_count: number;
  pickup_point: string | null;
  dropoff_point: string | null;
  assigned_ride_id: string | null;
};

export default async function DriverDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/driver");

  const { data: application } = await supabase
    .from("driver_applications")
    .select(
      "id, status, full_name, phone, vehicle_brand, vehicle_model, vehicle_color, plate_number, seat_count"
    )
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) redirect("/offer-a-ride");

  const [{ data: ridesData }, { data: bookingsData }, { data: requestsData }, { data: reviewsData }, { data: submittedReviews }] =
    await Promise.all([
      supabase
        .from("rides")
        .select(
          "id, from_city, to_city, travel_date, travel_time, available_seats, price_per_seat, pickup_point"
        )
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ride_bookings")
        .select(
          "id, ride_id, full_name, phone, seats_booked, payment_status, total_amount, trip_status, rides!inner(driver_id)"
        )
        .eq("rides.driver_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ride_requests")
        .select(
          "id, full_name, phone, from_city, to_city, travel_date, passenger_count, pickup_point, dropoff_point, assigned_ride_id"
        )
        .eq("assigned_driver_id", user.id)
        .eq("status", "assigned")
        .order("assigned_at", { ascending: false }),
      supabase
        .from("ride_reviews")
        .select("rating")
        .eq("reviewee_id", user.id)
        .eq("context", "driver")
        .eq("status", "published"),
      supabase
        .from("ride_reviews")
        .select("booking_id")
        .eq("reviewer_id", user.id)
        .eq("context", "passenger"),
    ]);

  const rides = (ridesData || []) as DriverRide[];
  const bookings = (bookingsData || []) as RideBooking[];
  const assignedRequests = (requestsData || []) as AssignedRequest[];
  const passengerCount = bookings.reduce(
    (total, booking) => total + Number(booking.seats_booked || 0),
    0
  );
  const openRideIds = new Set(
    bookings
      .filter((booking) => booking.payment_status === "paid" && booking.trip_status !== "completed")
      .map((booking) => booking.ride_id)
  );
  const reviewedBookingIds = new Set((submittedReviews || []).map((review) => review.booking_id));
  const completedTrips = new Set(bookings.filter((booking) => booking.trip_status === "completed").map((booking) => booking.ride_id)).size;
  const averageRating = reviewsData?.length
    ? (reviewsData.reduce((total, review) => total + Number(review.rating), 0) / reviewsData.length).toFixed(1)
    : "New";

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
                Driver Dashboard
              </p>
              <h1 className="mt-4 text-4xl font-black md:text-5xl">
                Welcome, {application.full_name || "Driver"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Manage your approved vehicle, offered rides, passengers, and
                assigned passenger requests.
              </p>
            </div>

            <Link
              href="/offer-a-ride/create"
              className="inline-flex justify-center rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
            >
              Offer a Ride
            </Link>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Driver Status" value="Approved" />
          <StatCard label="Created Rides" value={String(rides.length)} />
          <StatCard label="Booked Passengers" value={String(passengerCount)} />
          <StatCard
            label="Assigned Requests"
            value={String(assignedRequests.length)}
          />
          <StatCard label="Rating" value={averageRating} />
          <StatCard label="Reviews" value={String(reviewsData?.length || 0)} />
          <StatCard label="Completed Trips" value={String(completedTrips)} />
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-2xl font-black">Approved Vehicle</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Driver" value={application.full_name} />
            <Info
              label="Vehicle"
              value={`${application.vehicle_brand || ""} ${
                application.vehicle_model || ""
              }`.trim()}
            />
            <Info label="Color" value={application.vehicle_color} />
            <Info label="Plate Number" value={application.plate_number} />
            <Info label="Approved Seats" value={application.seat_count} />
            <Info label="Phone" value={application.phone} />
          </div>
        </section>

        <DriverSection
          title="Your Rides"
          emptyTitle="No rides created yet"
          emptyText="Create your first ride to start accepting passenger bookings."
          icon={<Car className="h-6 w-6" />}
        >
          {rides.map((ride) => (
            <Link
              key={ride.id}
              href={`/rides/${ride.id}`}
              className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              <h3 className="text-xl font-black">
                {ride.from_city} to {ride.to_city}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {ride.travel_date} · {ride.travel_time}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Seats Left" value={ride.available_seats} />
                <Info label="Price Per Seat" value={`NGN ${ride.price_per_seat}`} />
                <Info label="Pickup" value={ride.pickup_point} />
              </div>
              {openRideIds.has(ride.id) && (
                <form action={completeTrip} className="mt-5">
                  <input type="hidden" name="rideId" value={ride.id} />
                  <button className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-[#04130c]">
                    Mark Trip Completed
                  </button>
                </form>
              )}
            </Link>
          ))}
        </DriverSection>

        <DriverSection
          title="Passengers and Bookings"
          emptyTitle="No passenger bookings yet"
          emptyText="Paid bookings for your offered rides will appear here."
          icon={<Users className="h-6 w-6" />}
        >
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-black">{booking.full_name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{booking.phone}</p>
                </div>
                <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase text-emerald-300">
                  {booking.trip_status || booking.payment_status}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Info label="Seats" value={booking.seats_booked} />
                <Info label="Amount" value={`NGN ${booking.total_amount}`} />
                <Info label="Ride ID" value={booking.ride_id.slice(0, 8)} />
              </div>
              {booking.payment_status === "paid" &&
                booking.trip_status === "completed" &&
                !reviewedBookingIds.has(booking.id) && (
                  <ReviewForm bookingId={booking.id} context="passenger" label="Rate this passenger" />
                )}
            </div>
          ))}
        </DriverSection>

        <DriverSection
          title="Assigned Ride Requests"
          emptyTitle="No assigned requests"
          emptyText="Requests assigned to you by an admin will appear here."
          icon={<Route className="h-6 w-6" />}
        >
          {assignedRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-xl font-black">
                {request.from_city} to {request.to_city}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {request.travel_date} · {request.passenger_count} passenger
                {request.passenger_count === 1 ? "" : "s"}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Passenger" value={request.full_name} />
                <Info label="Phone" value={request.phone} />
                <Info label="Pickup" value={request.pickup_point} />
                <Info label="Dropoff" value={request.dropoff_point} />
              </div>
            </div>
          ))}
        </DriverSection>
      </div>
    </main>
  );
}

function DriverSection({
  title,
  emptyTitle,
  emptyText,
  icon,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyText: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
          {icon}
        </div>
        <h2 className="text-3xl font-black">{title}</h2>
      </div>

      {hasChildren ? (
        <div className="mt-6 grid gap-5">{children}</div>
      ) : (
        <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-6">
          <h3 className="text-xl font-black">{emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-400">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-white">
        {value ? String(value) : "Not provided"}
      </p>
    </div>
  );
}
