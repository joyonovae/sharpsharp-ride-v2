import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DriverApplication = {
  full_name: string | null;
  phone: string | null;
  passport_photo_url: string | null;
  car_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  plate_number: string | null;
  seat_count: number | null;
  city: string | null;
};

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: driver, error } = await supabase
    .from("driver_applications")
    .select(
      "full_name, phone, passport_photo_url, car_type, vehicle_brand, vehicle_model, vehicle_color, plate_number, seat_count, city"
    )
    .eq("user_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<DriverApplication>();

  if (error || !driver) {
    return notFound();
  }

  return (
    <section className="px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* HEADER */}
        <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/10">
            {driver.passport_photo_url ? (
              <img
                src={driver.passport_photo_url}
                alt={driver.full_name || "Driver"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white/60">
                {(driver.full_name || "D").charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black">
              {driver.full_name || "Approved Driver"}
            </h1>

            <p className="mt-1 text-sm text-[#18c37e]">
              Verified Driver • Ratings coming soon
            </p>

            {driver.city && (
              <p className="mt-2 text-sm text-white/60">
                Based in {driver.city}
              </p>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div className="grid gap-6 md:grid-cols-2">
          <Info label="Phone" value={driver.phone} />
          <Info label="Vehicle Type" value={driver.car_type} />

          <Info
            label="Vehicle"
            value={`${driver.vehicle_brand || ""} ${
              driver.vehicle_model || ""
            }`.trim()}
          />

          <Info label="Color" value={driver.vehicle_color} />
          <Info label="Plate Number" value={driver.plate_number} />
          <Info label="Seat Capacity" value={driver.seat_count} />
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 font-bold text-white">
        {value ? String(value) : "Not provided"}
      </p>
    </div>
  );
}