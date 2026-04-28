import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  User,
  WalletCards,
} from "lucide-react";

function getStatusColor(status?: string | null) {
  if (status === "approved") return "text-emerald-400";
  if (status === "rejected") return "text-red-400";
  return "text-yellow-400";
}

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

  return (
    <main className="bg-[#061116] px-5 py-12 text-white lg:px-12">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* HERO */}
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-7 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
                Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Welcome back, {profile?.full_name || "User"} 👋
              </h1>

              <p className="mt-4 max-w-2xl text-slate-300">
                Manage your rides, bookings, profile, and driver application
                from one simple place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/rides"
                  className="rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
                >
                  Book a Ride
                </Link>

                <Link
                  href="/dashboard/bookings"
                  className="rounded-full border border-white/15 px-7 py-4 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
                >
                  My Bookings
                </Link>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <User className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-2xl font-black">Account Summary</h2>

              <div className="mt-5 grid gap-3">
                <Info label="Email" value={user.email || "—"} />
                <Info label="Phone" value={profile?.phone || "Not set"} />
                <Info label="Role" value={profile?.role || "passenger"} />
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
                Quick Actions
              </p>
              <h2 className="mt-2 text-3xl font-black">What would you like to do?</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              href="/rides"
              icon={<Car className="h-6 w-6" />}
              title="Book a Ride"
              desc="Find available shared rides and reserve a seat."
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

        {/* DRIVER APPLICATION */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
                Driver Application
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {application ? "Your driver application" : "Become a driver"}
              </h2>

              {!application ? (
                <p className="mt-3 max-w-2xl text-slate-300">
                  Apply to become a verified SharpSharp Ride driver and start
                  offering rides after approval.
                </p>
              ) : (
                <p className="mt-3 max-w-2xl text-slate-300">
                  Your application is currently marked as{" "}
                  <span className={`font-bold ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                  .
                </p>
              )}
            </div>

            {!application ? (
              <Link
                href="/apply/driver"
                className="inline-flex rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Apply as Driver
              </Link>
            ) : application.status === "approved" ? (
              <Link
                href="/offer-a-ride/create"
                className="inline-flex rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Create Ride
              </Link>
            ) : application.status === "rejected" ? (
              <Link
                href="/apply/driver"
                className="inline-flex rounded-full bg-red-500 px-7 py-4 font-bold text-white"
              >
                Reapply
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-5 py-3 font-bold text-yellow-300">
                <Clock className="h-5 w-5" />
                Under Review
              </div>
            )}
          </div>

          {application && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Status" value={application.status} />
              <Info label="Vehicle" value={`${application.vehicle_brand || ""} ${application.vehicle_model || ""}`} />
              <Info label="Plate Number" value={application.plate_number || "—"} />
              <Info label="Seats" value={application.seat_count || "—"} />
            </div>
          )}
        </section>

        {/* TRUST STRIP */}
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[#04130c]">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-xl font-black">Your account is active</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  You can book rides, manage bookings, update your profile, and
                  track your driver application status.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-white/15 px-6 py-3 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              View Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-white">{value || "—"}</p>
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
      className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-2 hover:border-emerald-400/50 hover:bg-white/10"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
    </Link>
  );
}