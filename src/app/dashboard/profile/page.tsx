import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

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
    <section className="px-4 py-10 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-black">My Profile</h1>

            <Link
              href="/dashboard/bookings"
              className="inline-flex rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]"
            >
              My Bookings →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="Email" value={user.email || "—"} />
            <Info label="Full Name" value={profile?.full_name || "—"} />
            <Info label="Phone" value={profile?.phone || "—"} />
            <Info
              label="Driver Status"
              value={profile?.driver_status || "none"}
              highlight
            />
          </div>
        </div>

        {application && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Driver Application</h2>

              <span className="rounded-full bg-yellow-500/20 px-4 py-1 text-sm font-bold text-yellow-400">
                {application.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label="Full Name" value={application.full_name} />
              <Info label="Phone" value={application.phone} />
              <Info label="City" value={application.city} />
              <Info label="License" value={application.license_number} />
              <Info
                label="Vehicle"
                value={`${application.vehicle_brand || ""} ${
                  application.vehicle_model || ""
                }`}
              />
              <Info label="Color" value={application.vehicle_color} />
              <Info label="Plate" value={application.plate_number} />
              <Info label="Seats" value={application.seat_count} />

              <div className="md:col-span-2">
                <Info label="Address" value={application.address} />
              </div>
            </div>

            {application.vehicle_image_url && (
              <div className="mt-6">
                <img
                  src={application.vehicle_image_url}
                  alt="Vehicle"
                  className="h-64 w-full rounded-2xl object-cover"
                />
              </div>
            )}

            {application.status === "approved" && (
              <Link
                href="/offer-a-ride"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 font-bold text-[#04130c]"
              >
                Create Ride
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Info({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>
        {value || "—"}
      </p>
    </div>
  );
}