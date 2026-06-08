import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminRide } from "./actions";
import { User } from "lucide-react";

export default async function AdminCreateRidePage({
  searchParams,
}: {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
    pickup?: string;
  }>;
}) {
  const params = await searchParams;

  const initialFrom = params?.from || "";
  const initialTo = params?.to || "";
  const initialDate = params?.date || "";
  const initialPassengers = params?.passengers || "";

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

  const { data: drivers } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/admin"
          className="inline-flex text-sm font-bold text-emerald-400 hover:text-emerald-300"
        >
          ← Back to admin
        </Link>

        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            Admin Ride Creation
          </p>

          <h1 className="mt-4 text-4xl font-black">
            Create Operational Ride
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Create a ride manually for passenger demand, then assign ride
            requests to this trip.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
          {drivers && drivers.length > 0 ? (
            <form action={createAdminRide} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Select approved driver
                </label>

                <select
                  name="driverApplicationId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#08141b] px-4 py-4 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option value="">Choose driver</option>
                  {drivers.map((driver: any) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} — {driver.vehicle_brand}{" "}
                      {driver.vehicle_model} — {driver.plate_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input name="fromCity" label="From city" defaultValue={initialFrom} required />
                <Input name="toCity" label="To city" defaultValue={initialTo} required />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  name="travelDate"
                  label="Travel date"
                  type="date"
                  defaultValue={initialDate}
                  required
                />

                <Input
                  name="travelTime"
                  label="Travel time"
                  type="time"
                  required
                />

                <Input
                  name="availableSeats"
                  label="Available seats"
                  type="number"
                  min="1"
                  defaultValue={initialPassengers || "1"}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="pricePerSeat"
                  label="Price per seat"
                  type="number"
                  min="1"
                  required
                />

                <Input
                  name="pickupPoint"
                  label="Pickup point"
                  defaultValue={params?.pickup || ""}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Trip notes
                </label>

                <textarea
                  name="tripNotes"
                  rows={4}
                  placeholder="Admin notes, meeting point, route details..."
                  className="w-full rounded-2xl border border-white/10 bg-[#08141b] px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-emerald-500 px-6 py-4 font-black text-[#04130c] transition hover:bg-emerald-400"
              >
                Create Ride
              </button>
            </form>
          ) : (
            <div className="rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <User className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No approved drivers yet
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                You need at least one approved driver before creating an
                operational ride.
              </p>

              <Link
                href="/admin/driver-applications"
                className="mt-6 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Review Driver Applications
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Input({
  name,
  label,
  type = "text",
  defaultValue = "",
  required = false,
  min,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white/80">
        {label}
      </label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        className="w-full rounded-2xl border border-white/10 bg-[#08141b] px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400"
      />
    </div>
  );
}
