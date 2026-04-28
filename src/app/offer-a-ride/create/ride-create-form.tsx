"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RideCreateForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("rides").insert({
      driver_id: userId,
      from_city: form.from_city,
      to_city: form.to_city,
      travel_date: form.travel_date,
      travel_time: form.travel_time,
      price_per_seat: Number(form.price_per_seat),
      available_seats: Number(form.available_seats),
      pickup_point: form.pickup_point,
      trip_notes: form.trip_notes,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/rides");
    router.refresh();
  }

  return (
    <section className="bg-[linear-gradient(135deg,#031326_0%,#051a33_42%,#062445_100%)] px-5 py-14 text-white lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
        <h1 className="text-4xl font-black">Offer a Ride</h1>
        <p className="mt-3 text-slate-300">
          Create a ride listing for passengers to book.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input required placeholder="From city" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.from_city} onChange={(e) => setForm({ ...form, from_city: e.target.value })} />
            <input required placeholder="To city" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.to_city} onChange={(e) => setForm({ ...form, to_city: e.target.value })} />
            <input required type="date" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} />
            <input required type="time" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.travel_time} onChange={(e) => setForm({ ...form, travel_time: e.target.value })} />
            <input required type="number" placeholder="Price per seat" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.price_per_seat} onChange={(e) => setForm({ ...form, price_per_seat: e.target.value })} />
            <input required type="number" placeholder="Available seats" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none" value={form.available_seats} onChange={(e) => setForm({ ...form, available_seats: e.target.value })} />
            <input required placeholder="Pickup point" className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 outline-none md:col-span-2" value={form.pickup_point} onChange={(e) => setForm({ ...form, pickup_point: e.target.value })} />
            <textarea placeholder="Trip notes" className="min-h-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 outline-none md:col-span-2" value={form.trip_notes} onChange={(e) => setForm({ ...form, trip_notes: e.target.value })} />
          </div>

          <button
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-emerald-500 font-black text-[#04130c]"
          >
            {loading ? "Creating..." : "Create Ride"}
          </button>
        </form>
      </div>
    </section>
  );
}