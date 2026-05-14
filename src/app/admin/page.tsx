import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Car,
  ClipboardList,
  Package,
  Route,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: rideRequestCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true });

  const { count: driverApplicationCount } = await supabase
    .from("driver_applications")
    .select("*", { count: "exact", head: true });

  const { count: ridesCount } = await supabase
    .from("rides")
    .select("*", { count: "exact", head: true });

  const { count: vehiclesCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  const { count: deliveriesCount } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            SharpSharp Ride Admin
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            Admin Control Center
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Manage ride requests, driver approvals, rentals, deliveries, rides,
            and operational activity from one central place.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            href="/admin/ride-requests"
            icon={<Route className="h-6 w-6" />}
            title="Ride Requests"
            desc="View passenger requests, grouped demand, route clusters, and assignment preparation."
            count={rideRequestCount || 0}
          />

          <AdminCard
            href="/admin/driver-applications"
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Driver Applications"
            desc="Review driver applications, vehicle details, approval status, and verification."
            count={driverApplicationCount || 0}
          />

          <AdminCard
            href="/admin/vehicles"
            icon={<Car className="h-6 w-6" />}
            title="Rental Vehicles"
            desc="Manage rental fleet, car listings, vehicle details, images, and pricing."
            count={vehiclesCount || 0}
          />

          <AdminCard
            href="/admin/rental-requests"
            icon={<WalletCards className="h-6 w-6" />}
            title="Rental Requests"
            desc="Review customer car rental enquiries and prepare owner/admin responses."
            count={0}
          />

          <AdminCard
            href="/admin/delivery-requests"
            icon={<Package className="h-6 w-6" />}
            title="Delivery Requests"
            desc="Manage parcel delivery requests, pickup/dropoff details, and future tracking."
            count={deliveriesCount || 0}
          />

          <AdminCard
            href="/admin/rides"
            icon={<ClipboardList className="h-6 w-6" />}
            title="Published Rides"
            desc="View rides created by approved drivers and monitor active route supply."
            count={ridesCount || 0}
          />

          <AdminCard
            href="/dashboard"
            icon={<Users className="h-6 w-6" />}
            title="User Dashboard"
            desc="Return to the normal user dashboard experience."
            count={0}
          />
        </section>
      </div>
    </main>
  );
}

function AdminCard({
  href,
  icon,
  title,
  desc,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-2 hover:border-emerald-400/50 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
          {icon}
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-300">
          {count}
        </div>
      </div>

      <h2 className="mt-6 break-words text-2xl font-black">{title}</h2>

      <p className="mt-3 break-words text-sm leading-7 text-slate-400">
        {desc}
      </p>

      <p className="mt-6 text-sm font-bold text-emerald-400">
        Open management →
      </p>
    </Link>
  );
}