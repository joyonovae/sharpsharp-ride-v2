"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Vehicle = { id: string; name: string | null; brand: string | null; model: string | null; location: string | null; price_per_day: number; car_image_url: string | null; is_available: boolean };

function countDays(start: string, end: string) {
  if (!start || !end) return 0;
  const value = Math.floor((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function RentalCheckoutClient({ vehicle, userEmail, userId }: { vehicle: Vehicle; userEmail: string; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState({ fullName: "", phone: "", startDate: "", endDate: "", pickupLocation: vehicle.location || "", returnLocation: vehicle.location || "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const days = countDays(form.startDate, form.endDate);
  const total = days * Number(vehicle.price_per_day);
  const today = new Date().toISOString().slice(0, 10);
  const title = vehicle.name || `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || "Rental vehicle";

  useEffect(() => {
    supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle().then(({ data }) => {
      setForm((current) => ({ ...current, fullName: data?.full_name || current.fullName, phone: data?.phone || current.phone }));
    });
  }, [supabase, userId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (days < 1 || form.startDate < today) { setError("Choose valid rental dates starting today or later."); return; }
    setLoading(true); setError("");
    const response = await fetch("/api/paystack/rental-initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicleId: vehicle.id, ...form }) });
    const result = await response.json();
    if (!response.ok || !result.status) { setError(result.message || "Could not initialize payment."); setLoading(false); return; }
    window.location.href = result.authorization_url;
  }

  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]">
    <form onSubmit={submit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Rental Checkout</p><h1 className="mt-3 text-3xl font-black">Book {title}</h1><p className="mt-2 text-sm text-slate-400">Confirm your details and dates before continuing to Paystack.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })}/><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })}/><Field label="Email" value={userEmail} disabled/><Field label="Start date" type="date" min={today} value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })}/><Field label="End date" type="date" min={form.startDate || today} value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })}/><Field label="Pickup location" value={form.pickupLocation} onChange={(value) => setForm({ ...form, pickupLocation: value })}/><Field label="Return location" value={form.returnLocation} onChange={(value) => setForm({ ...form, returnLocation: value })}/></div>
      <details className="rounded-2xl border border-white/10 bg-white/5 p-4"><summary className="cursor-pointer font-bold">Add rental notes (optional)</summary><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className="mt-4 w-full rounded-2xl bg-white/10 p-4" placeholder="Pickup timing or useful details"/></details>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</p>}
      <button disabled={loading || days < 1} className="w-full rounded-full bg-emerald-500 px-6 py-4 font-bold text-[#04130c] disabled:opacity-50">{loading ? "Starting payment..." : "Pay with Paystack"}</button>
    </form>
    <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/5 p-6"><img src={vehicle.car_image_url || "/images/car-placeholder.jpg"} alt={title} className="h-52 w-full rounded-2xl object-cover"/><h2 className="mt-5 text-2xl font-black">{title}</h2><Info label="Price per day" value={`NGN ${Number(vehicle.price_per_day).toLocaleString()}`}/><Info label="Rental days" value={String(days || "-")}/><Info label="Total" value={`NGN ${total.toLocaleString()}`}/></aside>
  </div></main>;
}

function Field({ label, value, onChange, type = "text", min, disabled = false }: { label: string; value: string; onChange?: (value: string) => void; type?: string; min?: string; disabled?: boolean }) {
  return <label className="text-sm text-white/80">{label}<input required={!disabled} disabled={disabled} type={type} min={min} value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white disabled:opacity-60"/></label>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="mt-4 flex justify-between gap-4 border-t border-white/10 pt-4"><span className="text-slate-400">{label}</span><strong className="text-emerald-300">{value}</strong></div>;
}
