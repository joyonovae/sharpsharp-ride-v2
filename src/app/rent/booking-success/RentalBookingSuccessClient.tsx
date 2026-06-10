"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RentalBookingSuccessClient({ reference }: { reference: string }) {
  const [state, setState] = useState<"verifying"|"success"|"error">("verifying");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{
    start_date: string; end_date: string; pickup_location: string; return_location: string; total_amount: number;
    vehicles: { name: string | null; brand: string | null; model: string | null } | Array<{ name: string | null; brand: string | null; model: string | null }> | null;
  } | null>(null);
  useEffect(() => { async function verify() {
    if (!reference) { setMessage("Payment reference is missing."); setState("error"); return; }
    const response = await fetch("/api/rental-bookings/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
    const result = await response.json();
    if (!response.ok || !result.success) { setMessage(result.error || "Rental payment verification failed."); setState("error"); return; }
    setDetails(result.details); setState("success");
  } verify(); }, [reference]);
  const vehicle = Array.isArray(details?.vehicles) ? details.vehicles[0] : details?.vehicles;
  const vehicleName = vehicle?.name || `${vehicle?.brand || ""} ${vehicle?.model || ""}`.trim();
  return <main className="min-h-screen bg-[#061116] px-4 py-14 text-white"><div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
    {state === "verifying" && <><h1 className="text-3xl font-black">Verifying rental payment...</h1><p className="mt-3 text-slate-400">Please wait while we confirm and save your rental booking.</p></>}
    {state === "error" && <><h1 className="text-3xl font-black text-red-300">Payment verification failed</h1><p className="mt-3 text-red-200">{message}</p><Link href="/rent" className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]">Return to Rentals</Link></>}
    {state === "success" && <><h1 className="text-4xl font-black">Rental booked successfully</h1><p className="mt-3 text-slate-300">Your payment is confirmed and the rental booking is saved.</p><div className="mt-7 grid gap-3 text-left sm:grid-cols-2"><Info label="Vehicle" value={vehicleName || "Rental vehicle"}/><Info label="Dates" value={`${details?.start_date} to ${details?.end_date}`}/><Info label="Pickup" value={details?.pickup_location || "Not provided"}/><Info label="Return" value={details?.return_location || "Not provided"}/><Info label="Total" value={`NGN ${Number(details?.total_amount || 0).toLocaleString()}`}/><Info label="Status" value="Paid / Confirmed"/></div><Link href="/dashboard/rentals" className="mt-7 inline-block rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]">View Rental Bookings</Link></>}
  </div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-bold">{value || "Not provided"}</p></div>; }
