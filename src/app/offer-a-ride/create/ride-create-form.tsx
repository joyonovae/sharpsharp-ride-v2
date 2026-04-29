"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DriverApplication = {
  full_name: string | null;
  phone: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  plate_number: string | null;
};

export default function RideCreateForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(true);
  const [driverApp, setDriverApp] = useState<DriverApplication | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    from_city: "",
    to_city: "",
    travel_date: "",
    travel_time: "",
    price_per_seat: "",
    available_seats: "",
    pickup_point: "",
    trip_notes: "",
  });

  useEffect(() => {
    async function loadDriverApplication() {
      const { data, error } = await supabase
        .from("driver_applications")
        .select(
          "full_name, phone, vehicle_brand, vehicle_model, vehicle_color, plate_number"
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .maybeSingle();

      if (error || !data) {
        setErrorMessage(
          "Your approved driver application details could not be found. Please contact admin."
        );
        setDriverApp(null);
      } else {
        setDriverApp(data);
      }

      setLoadingDriver(false);
    }

    loadDriverApplication();
  }, [supabase, userId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!driverApp) {
      setErrorMessage("Driver details missing. You cannot create a ride yet.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.from("rides").insert({
      driver_id: userId,

      from_city: form.from_city.trim(),
      to_city: form.to_city.trim(),
      travel_date: form.travel_date,
      travel_time: form.travel_time,
      price_per_seat: Number(form.price_per_seat),
      available_seats: Number(form.available_seats),
      pickup_point: form.pickup_point.trim(),
      trip_notes: form.trip_notes.trim(),

      driver_name: driverApp.full_name,
      driver_phone: driverApp.phone,
      vehicle_brand: driverApp.vehicle_brand,
      vehicle_model: driverApp.vehicle_model,
      vehicle_color: driverApp.vehicle_color,
      plate_number: driverApp.plate_number,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/rides");
    router.refresh();
  }

  if (loadingDriver) {
    return <div className="p-10 text-white">Loading driver details...</div>;
  }

  return (
    <section className="bg-[linear-gradient(135deg,#031326_0%,#051a33_42%,#062445_100%)] px-5 py-14 text-white lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
        <h1 className="text-4xl font-black">Offer a Ride</h1>
        <p className="mt-3 text-slate-300">
          Create a ride listing for passengers to book.
        </p>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {driverApp && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <h2 className="font-bold text-emerald-300">
              Driver & Vehicle Attached
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {driverApp.full_name} • {driverApp.vehicle_brand}{" "}
              {driverApp.vehicle_model} • {driverApp.plate_number}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="From city"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.from_city}
              onChange={(e) =>
                setForm({ ...form, from_city: e.target.value })
              }
            />

            <input
              required
              placeholder="To city"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.to_city}
              onChange={(e) => setForm({ ...form, to_city: e.target.value })}
            />

            <input
              required
              type="date"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.travel_date}
              onChange={(e) =>
                setForm({ ...form, travel_date: e.target.value })
              }
            />

            <input
              required
              type="time"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.travel_time}
              onChange={(e) =>
                setForm({ ...form, travel_time: e.target.value })
              }
            />

            <input
              required
              type="number"
              placeholder="Price per seat"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.price_per_seat}
              onChange={(e) =>
                setForm({ ...form, price_per_seat: e.target.value })
              }
            />

            <input
              required
              type="number"
              placeholder="Available seats"
              className="h-14 rounded-2xl bg-white/10 px-4"
              value={form.available_seats}
              onChange={(e) =>
                setForm({ ...form, available_seats: e.target.value })
              }
            />

            <input
              required
              placeholder="Pickup point"
              className="h-14 rounded-2xl bg-white/10 px-4 md:col-span-2"
              value={form.pickup_point}
              onChange={(e) =>
                setForm({ ...form, pickup_point: e.target.value })
              }
            />
          </div>

          <textarea
            placeholder="Trip notes"
            className="w-full rounded-2xl bg-white/10 p-4"
            value={form.trip_notes}
            onChange={(e) => setForm({ ...form, trip_notes: e.target.value })}
          />

          <button
            disabled={loading || !driverApp}
            className="h-14 w-full rounded-2xl bg-emerald-500 font-black text-[#04130c] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Ride"}
          </button>
        </form>
      </div>
    </section>
  );
}