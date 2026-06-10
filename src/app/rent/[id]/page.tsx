import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type VehicleRow = {
  [key: string]: unknown;
};

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function getBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeVehicle(vehicle: VehicleRow) {
  const id = getString(vehicle.id);

  const title =
    getString(vehicle.name) ||
    getString(vehicle.title) ||
    getString(vehicle.vehicle_name) ||
    getString(vehicle.vehicle_type) ||
    "Vehicle";

  const subtitle =
    getString(vehicle.brand) ||
    getString(vehicle.model) ||
    getString(vehicle.license_plate);

  const image =
    getString(vehicle.car_image_url) ||
    getString(vehicle.image_url) ||
    getString(vehicle.vehicle_image) ||
    getString(vehicle.image) ||
    "/images/car-placeholder.jpg";

  const pricePerDay =
    getNumber(vehicle.price_per_day) ||
    getNumber(vehicle.daily_price) ||
    getNumber(vehicle.price) ||
    0;

  const seats =
    getNumber(vehicle.seats) ||
    getNumber(vehicle.capacity) ||
    getNumber(vehicle.passenger_capacity) ||
    0;

  const transmission =
    getString(vehicle.transmission) ||
    getString(vehicle.gear_type) ||
    getString(vehicle.transmission_type);

  const fuelType =
    getString(vehicle.fuel_type) ||
    getString(vehicle.fuel) ||
    getString(vehicle.engine_type);

  const location =
    getString(vehicle.location) ||
    getString(vehicle.city) ||
    getString(vehicle.pickup_location);

  const description =
    getString(vehicle.description) ||
    getString(vehicle.notes) ||
    getString(vehicle.vehicle_notes);

  const status = getString(vehicle.status).toLowerCase();

  const isAvailable =
    getBoolean(vehicle.is_available, true) &&
    status !== "unavailable" &&
    status !== "booked";

  return {
    id,
    title,
    subtitle,
    image,
    pricePerDay,
    seats,
    transmission,
    fuelType,
    location,
    description,
    isAvailable,
  };
}

export default async function RentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const vehicle = normalizeVehicle(data);

  const rentNowHref = user
    ? `/rent/${vehicle.id}/checkout`
    : `/login?next=${encodeURIComponent(`/rent/${vehicle.id}/checkout`)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/rent" className="mb-6 inline-block text-green-400">
        ← Back to Rent
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <img
              src={vehicle.image}
              alt={vehicle.title}
              className="h-[280px] w-full object-cover md:h-[420px]"
            />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
              Vehicle Overview
            </p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {vehicle.title}
            </h1>

            {vehicle.subtitle && (
              <p className="mt-2 text-white/55">{vehicle.subtitle}</p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 p-5">
            <p className="mb-2 text-sm text-white/50">Description</p>
            {vehicle.description ? (
              <p className="leading-7 text-white/72">{vehicle.description}</p>
            ) : (
              <p className="text-white/45">
                No additional vehicle description is available yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                Rental Details
              </p>
              <h2 className="text-xl font-semibold text-white">
                Vehicle Information
              </h2>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                vehicle.isAvailable
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              {vehicle.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className="mt-6 space-y-4 text-sm text-white/72">
            <div className="flex items-start justify-between gap-4">
              <span className="text-white/45">Price per Day</span>
              <span className="text-right text-lg font-bold text-green-400">
                {formatCurrency(vehicle.pricePerDay)}
              </span>
            </div>

            {vehicle.location && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/45">Location</span>
                <span className="text-right font-medium text-white">
                  {vehicle.location}
                </span>
              </div>
            )}

            {vehicle.seats > 0 && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/45">Seats</span>
                <span className="text-right font-medium text-white">
                  {vehicle.seats}
                </span>
              </div>
            )}

            {vehicle.transmission && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/45">Transmission</span>
                <span className="text-right font-medium text-white">
                  {vehicle.transmission}
                </span>
              </div>
            )}

            {vehicle.fuelType && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/45">Fuel Type</span>
                <span className="text-right font-medium text-white">
                  {vehicle.fuelType}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            {vehicle.isAvailable ? (
              <div className="space-y-3">
                {!user && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-white/75">
                    You can browse rental vehicles without logging in. Login is
                    only required when you want to rent a car.
                  </div>
                )}

                <Link
                  href={rentNowHref}
                  className="inline-flex w-full items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-[#08141b] hover:brightness-105"
                >
                  {user ? "Book This Rental" : "Login to Book This Rental"}
                </Link>
              </div>
            ) : (
              <button
                disabled
                className="w-full cursor-not-allowed rounded-full bg-gray-600 px-6 py-3 text-sm font-semibold text-white/70"
              >
                Vehicle Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
