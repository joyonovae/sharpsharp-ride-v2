"use client";

import { useRef, useState } from "react";
import { submitRentalVehicleApplication } from "../actions";

export default function RentalSubmitPage() {
  const [step, setStep] = useState(1);
  const [review, setReview] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  function continueTo(nextStep: number) {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
    const invalid = Array.from(fields || []).find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (nextStep === 3 && formRef.current) {
      const data = new FormData(formRef.current);
      setReview({
        owner: String(data.get("owner_name") || ""),
        location: String(data.get("location") || ""),
        vehicle: `${String(data.get("brand") || "")} ${String(data.get("model") || "")}`.trim(),
        details: `${String(data.get("vehicle_type") || "")} | ${String(data.get("seats") || "")} seats`,
        price: `NGN ${Number(data.get("price_per_day") || 0).toLocaleString()}/day`,
      });
    }
    setStep(nextStep);
  }
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
    <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Rental Owner · Step {step} of 3</p>
    <h1 className="mt-4 text-4xl font-black">Submit Your Vehicle</h1>
    <p className="mt-3 text-slate-300">Your vehicle stays private until an admin reviews and approves it.</p>
    <form ref={formRef} action={submitRentalVehicleApplication} className="mt-8">
      <section data-step="1" className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Heading title="Owner and Location" text="Tell us who owns the vehicle and where it is available."/>
        <Field name="owner_name" label="Owner Name" required/><Field name="phone" label="Phone" type="tel" required/><Field name="location" label="City / Location" required/>
        <button type="button" onClick={() => continueTo(2)} className="rounded-full bg-emerald-500 px-6 py-4 font-bold text-[#04130c] md:col-span-2">Continue to Vehicle Details</button>
      </section>
      <section data-step="2" className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Heading title="Vehicle Details" text="Provide the details customers need to understand the vehicle."/>
        <label className="text-sm text-white/80">Vehicle Type<select name="vehicle_type" required className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1d26] px-4 py-3"><option value="">Select type</option><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Minivan</option><option>Bus</option><option>Other</option></select></label>
        <Field name="brand" label="Brand" required/><Field name="model" label="Model" required/><Field name="vehicle_year" label="Year" type="number"/><Field name="color" label="Color"/><Field name="plate_number" label="Plate Number" required/>
        <label className="text-sm text-white/80">Seats<select name="seats" required className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1d26] px-4 py-3"><option value="">Select seats</option>{[2,3,4,5,6,7,8,9,10,12,14].map((seat) => <option key={seat}>{seat}</option>)}</select></label>
        <Field name="price_per_day" label="Price per Day (NGN)" type="number" required/><Field name="transmission" label="Transmission (optional)"/><Field name="fuel_type" label="Fuel Type (optional)"/>
        <div className="flex gap-3 md:col-span-2"><button type="button" onClick={() => setStep(1)} className="flex-1 rounded-full border border-white/15 px-6 py-4 font-bold">Back</button><button type="button" onClick={() => continueTo(3)} className="flex-1 rounded-full bg-emerald-500 px-6 py-4 font-bold text-[#04130c]">Review and Upload</button></div>
      </section>
      <section data-step="3" className={step === 3 ? "grid gap-4" : "hidden"}>
        <Heading title="Review and Submit" text="Check the summary, upload a clear image, then submit for admin review."/>
        <div className="grid gap-3 sm:grid-cols-2"><Review label="Owner" value={review.owner}/><Review label="Location" value={review.location}/><Review label="Vehicle" value={review.vehicle}/><Review label="Type / Capacity" value={review.details}/><Review label="Rental Price" value={review.price}/></div>
        <label className="text-sm text-white/80">Vehicle Image<p className="mt-1 text-xs text-slate-400">Use a clear exterior photo. Maximum size: 8MB.</p><input name="image" type="file" accept="image/*" required className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3"/></label>
        <label className="text-sm text-white/80">Notes (optional)<textarea name="notes" rows={4} placeholder="Condition, availability, or useful rental details" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"/></label>
        <div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="flex-1 rounded-full border border-white/15 px-6 py-4 font-bold">Edit Details</button><button className="flex-1 rounded-full bg-emerald-500 px-6 py-4 font-bold text-[#04130c]">Submit for Review</button></div>
      </section>
    </form>
  </div></main>;
}

function Heading({ title, text }: { title: string; text: string }) {
  return <div className="md:col-span-2"><h2 className="text-xl font-black">{title}</h2><p className="mt-2 text-sm text-slate-400">{text}</p></div>;
}
function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="text-sm text-white/80">{label}<input name={name} type={type} required={required} min={type === "number" ? 1 : undefined} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"/></label>;
}
function Review({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
