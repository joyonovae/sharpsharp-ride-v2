"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    getString(vehicle.brand && `${vehicle.brand}`) ||
    getString(vehicle.model && `${vehicle.model}`) ||
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

  const isAvailable =
    getBoolean(vehicle.is_available, true) &&
    getString(vehicle.status).toLowerCase() !== "unavailable" &&
    getString(vehicle.status).toLowerCase() !== "booked";

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
    isAvailable,
  };
}

export default function RentPage() {
  const supabase = useMemo(() => createClient(), []);

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await supabase.from("vehicles").select("*");

      if (error) {
        console.error("Error fetching vehicles:", error.message);
      } else {
        setVehicles(data || []);
      }

      setLoading(false);
    }

    fetchVehicles();
  }, [supabase]);

  const normalizedVehicles = vehicles.map(normalizeVehicle);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/45">
          Car Rental
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Rent a Vehicle
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
          Explore available vehicles, compare features, and choose the best car
          for your next trip.
        </p>
      </div>

      {loading && <p className="text-white/60">Loading vehicles...</p>}

      {!loading && normalizedVehicles.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6">
          <p className="text-white/65">No vehicles available yet.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {normalizedVehicles.map((vehicle) => {
          const cardContent = (
            <>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <img
                  src={vehicle.image}
                  alt={vehicle.title}
                  className="h-52 w-full object-cover"
                />
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {vehicle.title}
                  </h2>
                  {vehicle.subtitle && (
                    <p className="mt-1 text-sm text-white/50">
                      {vehicle.subtitle}
                    </p>
                  )}
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

              <div className="mt-5 space-y-3 text-sm text-white/72">
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

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Price per day
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-400">
                    {formatCurrency(vehicle.pricePerDay)}
                  </p>
                </div>

                <span
                  className={`text-sm font-medium ${
                    vehicle.isAvailable ? "text-green-400" : "text-white/35"
                  }`}
                >
                  {vehicle.isAvailable ? "View Details →" : "Unavailable"}
                </span>
              </div>
            </>
          );

          if (!vehicle.id || !vehicle.isAvailable) {
            return (
              <div
                key={vehicle.id || vehicle.title}
                className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6 opacity-85"
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={vehicle.id}
              href={`/rent/${vehicle.id}`}
              className="block rounded-3xl border border-white/10 bg-[#0d1c24] p-6 transition hover:border-green-400 hover:-translate-y-0.5"
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}