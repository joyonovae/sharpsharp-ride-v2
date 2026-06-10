import Link from "next/link";
import type React from "react";
import {
  Banknote,
  Car,
  ClipboardList,
  Route,
  ShieldCheck,
  Users,
  Star,
} from "lucide-react";
import { requireAdminPage } from "@/lib/admin/requireAdmin";

export default async function AdminPage() {
  const { profile, admin } = await requireAdminPage();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const today = new Date().toISOString().slice(0, 10);

  const [
    users,
    drivers,
    pendingDrivers,
    pendingRequests,
    activeRides,
    paidBookings,
    completedBookings,
    recentNotifications,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "driver"),
    admin.from("driver_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("ride_requests").select("*", { count: "exact", head: true }).in("status", ["pending", "matched"]),
    admin.from("rides").select("*", { count: "exact", head: true }).gte("travel_date", today).gt("available_seats", 0),
    admin.from("ride_bookings").select("total_amount, created_at").eq("payment_status", "paid"),
    admin.from("ride_bookings").select("*", { count: "exact", head: true }).eq("trip_status", "completed"),
    admin.from("notifications").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const revenue = (paidBookings.data || []).reduce(
    (total, booking) => total + Number(booking.total_amount || 0),
    0
  );
  const monthlyRevenue = (paidBookings.data || [])
    .filter((booking) => new Date(booking.created_at) >= monthStart)
    .reduce((total, booking) => total + Number(booking.total_amount || 0), 0);

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">SharpSharp Ride Admin</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Welcome, {profile.full_name || "Admin"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Monitor users, drivers, ride operations, bookings, and revenue from one control center.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total Users" value={users.count || 0} />
          <Metric label="Approved Drivers" value={drivers.count || 0} />
          <Metric label="Pending Drivers" value={pendingDrivers.count || 0} />
          <Metric label="Pending Requests" value={pendingRequests.count || 0} />
          <Metric label="Active Rides" value={activeRides.count || 0} />
          <Metric label="Paid Bookings" value={(paidBookings.data || []).length} />
          <Metric label="Completed Bookings" value={completedBookings.count || 0} />
          <Metric label="Total Revenue" value={`NGN ${revenue.toLocaleString()}`} />
          <Metric label="Revenue This Month" value={`NGN ${monthlyRevenue.toLocaleString()}`} />
        </section>

        <section>
          <h2 className="text-3xl font-black">Quick Actions</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AdminCard href="/admin/driver-applications" icon={<ShieldCheck />} title="Review Drivers" />
            <AdminCard href="/admin/ride-requests" icon={<Route />} title="Review Ride Requests" />
            <AdminCard href="/admin/rides/new" icon={<Car />} title="Create Ride" />
            <AdminCard href="/admin/bookings" icon={<ClipboardList />} title="View Bookings & Revenue" />
            <AdminCard href="/admin/users" icon={<Users />} title="View Users" />
            <AdminCard href="/admin/drivers" icon={<Banknote />} title="View Drivers" />
            <AdminCard href="/admin/rental-applications" icon={<Car />} title="Review Rental Vehicles" />
            <AdminCard href="/admin/reviews" icon={<Star />} title="Moderate Reviews" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Recent Activity</h2>
          <div className="mt-5 grid gap-3">
            {(recentNotifications.data || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-emerald-400">{value}</p></div>;
}

function AdminCard({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return <Link href={href} className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:border-emerald-400/50 hover:bg-white/10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">{icon}</div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 text-sm font-bold text-emerald-400">Open management</p></Link>;
}
