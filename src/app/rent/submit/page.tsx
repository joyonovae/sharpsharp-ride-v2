import { submitRentalVehicleApplication } from "../actions";

const fields = [
  ["owner_name", "Owner Name"], ["phone", "Phone"], ["location", "City / Location"],
  ["vehicle_type", "Vehicle Type"], ["brand", "Brand"], ["model", "Model"],
  ["vehicle_year", "Year"], ["color", "Color"], ["plate_number", "Plate Number"],
  ["seats", "Seats"], ["price_per_day", "Price per Day"], ["transmission", "Transmission"], ["fuel_type", "Fuel Type"],
];

export default function RentalSubmitPage() {
  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Rental Owner</p>
        <h1 className="mt-4 text-4xl font-black">Submit Your Vehicle</h1>
        <p className="mt-3 text-slate-300">Submissions are reviewed before they appear in rental inventory.</p>
        <form action={submitRentalVehicleApplication} className="mt-8 grid gap-4 md:grid-cols-2">
          {fields.map(([name, label]) => (
            <label key={name} className="text-sm text-white/80">{label}
              <input name={name} required={!["vehicle_year", "color", "transmission", "fuel_type"].includes(name)} type={["vehicle_year", "seats", "price_per_day"].includes(name) ? "number" : "text"} min={["seats", "price_per_day"].includes(name) ? 1 : undefined} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white" />
            </label>
          ))}
          <label className="text-sm text-white/80 md:col-span-2">Vehicle Image
            <input name="image" type="file" accept="image/*" required className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3" />
          </label>
          <label className="text-sm text-white/80 md:col-span-2">Notes
            <textarea name="notes" rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white" />
          </label>
          <button className="rounded-full bg-emerald-500 px-6 py-4 font-bold text-[#04130c] md:col-span-2">Submit for Review</button>
        </form>
      </div>
    </main>
  );
}
