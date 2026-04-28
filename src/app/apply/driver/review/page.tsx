import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DriverReviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/apply/driver/review");

  const { data: application } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) redirect("/apply/driver");

  const isApproved = application.status === "approved";

  return (
    <section className="bg-[linear-gradient(135deg,#031326_0%,#051a33_42%,#062445_100%)] px-5 py-14 text-white lg:px-8 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-400">
                Driver Application
              </p>
              <h1 className="mt-3 text-4xl font-black">
                {isApproved ? "Application Approved" : "Application Under Review"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                {isApproved
                  ? "Your driver profile has been approved. You can now create ride listings."
                  : "Your application has been submitted successfully. Our team will review your details and vehicle information."}
              </p>
            </div>

            <span className="rounded-full bg-yellow-400/10 px-5 py-3 font-bold text-yellow-300">
              {application.status}
            </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Full Name" value={application.full_name} />
              <Info label="Phone" value={application.phone} />
              <Info label="City" value={application.city} />
              <Info label="License Number" value={application.license_number} />
              <Info label="Vehicle Type" value={application.car_type} />
              <Info label="Vehicle Brand" value={application.vehicle_brand} />
              <Info label="Vehicle Model" value={application.vehicle_model} />
              <Info label="Vehicle Color" value={application.vehicle_color} />
              <Info label="Plate Number" value={application.plate_number} />
              <Info label="Seats" value={application.seat_count?.toString()} />
              <div className="sm:col-span-2">
                <Info label="Address" value={application.address} />
              </div>
            </div>

            <div>
              {application.vehicle_image_url ? (
                <img
                  src={application.vehicle_image_url}
                  alt="Vehicle"
                  className="h-64 w-full rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-400">
                  No vehicle image
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isApproved ? (
              <Link
                href="/offer-a-ride/create"
                className="rounded-full bg-emerald-500 px-6 py-4 text-center font-bold text-[#04130c]"
              >
                Create a Ride
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-full bg-emerald-500 px-6 py-4 text-center font-bold text-[#04130c]"
              >
                Back to Dashboard
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-white/15 px-6 py-4 text-center font-bold"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-white">{value || "N/A"}</p>
    </div>
  );
}