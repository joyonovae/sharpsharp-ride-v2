import { submitDriverApplication } from "./actions";

export default async function DriverApplicationPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#061116] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Apply as a Driver</h1>

        {params?.error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <form action={submitDriverApplication} className="space-y-5">
          <input required name="full_name" placeholder="Full name" className="w-full rounded-lg bg-slate-800 px-4 py-4 text-white outline-none" />
          <input required name="phone" placeholder="Phone number" className="w-full rounded-lg bg-slate-800 px-4 py-4 text-white outline-none" />
          <input required name="car_type" placeholder="Car type e.g Toyota Corolla" className="w-full rounded-lg bg-slate-800 px-4 py-4 text-white outline-none" />
          <input required name="plate_number" placeholder="Plate number" className="w-full rounded-lg bg-slate-800 px-4 py-4 text-white outline-none" />
          <input name="vehicle_color" placeholder="Vehicle color" className="w-full rounded-lg bg-slate-800 px-4 py-4 text-white outline-none" />

          <button type="submit" className="w-full rounded-lg bg-emerald-500 px-6 py-4 font-bold text-black">
            Submit Application
          </button>
        </form>
      </div>
    </main>
  );
}