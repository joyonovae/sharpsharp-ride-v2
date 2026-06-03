"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RequestRidePage() {
  return (
    <Suspense fallback={<RequestRideLoading />}>
      <RequestRideContent />
    </Suspense>
  );
}

function RequestRideLoading() {
  return (
    <main className="min-h-screen bg-[#08141b] px-4 py-24 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Ride Request
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Loading request form...
          </h1>
        </div>
      </section>
    </main>
  );
}

function RequestRideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const initialFrom = searchParams.get("from") || "";
  const initialTo = searchParams.get("to") || "";
  const initialDate = searchParams.get("date") || "";
  const initialPassengers = searchParams.get("passengers") || "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    from_city: initialFrom,
    to_city: initialTo,
    travel_date: initialDate,
    preferred_time: "",
    passenger_count: initialPassengers,
    pickup_point: "",
    dropoff_point: "",
    trip_notes: "",
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("ride_requests").insert({
      user_id: user.id,
      full_name: form.full_name,
      phone: form.phone,
      from_city: form.from_city,
      to_city: form.to_city,
      travel_date: form.travel_date,
      preferred_time: form.preferred_time,
      passenger_count: Number(form.passenger_count),
      pickup_point: form.pickup_point,
      dropoff_point: form.dropoff_point,
      trip_notes: form.trip_notes,
      status: "pending",
    });

    if (insertError) {
      setLoading(false);
      setError(insertError.message);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Ride request received",
      message: `Your ride request from ${form.from_city} to ${form.to_city} has been received and is being reviewed.`,
      type: "ride_request_submitted",
      is_read: false,
      link: "/notifications",
    });

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#08141b] px-4 py-24 text-white">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/rides"
          className="mb-6 inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Back to rides
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Ride Request
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">
              Request a ride before one is available
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Tell us where you’re going. We’ll use your route and travel date
              to match you with other passengers or assign a driver later.
            </p>

            {(initialFrom || initialTo || initialDate) && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                We filled this request using the route you searched for.
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full name"
                value={form.full_name}
                onChange={(v) => updateField("full_name", v)}
                required
              />
              <Input
                label="Phone number"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="From"
                placeholder="Lagos"
                value={form.from_city}
                onChange={(v) => updateField("from_city", v)}
                required
              />
              <Input
                label="To"
                placeholder="Abuja"
                value={form.to_city}
                onChange={(v) => updateField("to_city", v)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Travel date"
                type="date"
                value={form.travel_date}
                onChange={(v) => updateField("travel_date", v)}
                required
              />
              <Input
                label="Preferred time"
                placeholder="Morning / 8:00 AM"
                value={form.preferred_time}
                onChange={(v) => updateField("preferred_time", v)}
              />
              <Input
                label="Passengers"
                type="number"
                min="1"
                value={form.passenger_count}
                onChange={(v) => updateField("passenger_count", v)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Pickup point"
                value={form.pickup_point}
                onChange={(v) => updateField("pickup_point", v)}
              />
              <Input
                label="Dropoff point"
                value={form.dropoff_point}
                onChange={(v) => updateField("dropoff_point", v)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Trip notes
              </label>
              <textarea
                value={form.trip_notes}
                onChange={(e) => updateField("trip_notes", e.target.value)}
                rows={4}
                placeholder="Any luggage, special timing, or extra details?"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#18c37e] px-6 py-4 font-semibold text-[#061116] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting request..." : "Submit Ride Request"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400"
      />
    </div>
  );
}