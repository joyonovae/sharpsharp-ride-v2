"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  role: string;
};

export default function AdminNewVehiclePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [location, setLocation] = useState("");
  const [seats, setSeats] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function checkAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .single<Profile>();

      if (error || !profile || profile.role !== "admin") {
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAccess(false);
    }

    checkAdminAccess();
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!isAdmin) {
      setErrorMessage("You are not authorized to add vehicles.");
      return;
    }

    if (
      !name.trim() ||
      !brand.trim() ||
      !model.trim() ||
      !vehicleType.trim() ||
      !pricePerDay ||
      !location.trim() ||
      !seats ||
      !transmission.trim() ||
      !fuelType.trim() ||
      !description.trim() ||
      !imageFile
    ) {
      setErrorMessage("Please fill in all fields and upload an image.");
      return;
    }

    const parsedPrice = Number(pricePerDay);
    const parsedSeats = Number(seats);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Enter a valid price per day.");
      return;
    }

    if (Number.isNaN(parsedSeats) || parsedSeats <= 0) {
      setErrorMessage("Enter a valid seat count.");
      return;
    }

    setSubmitting(true);

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `vehicles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Vehicle image upload error:", uploadError.message);
      setErrorMessage(uploadError.message || "Image upload failed.");
      setSubmitting(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("vehicle-images").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("vehicles").insert([
      {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        vehicle_type: vehicleType.trim(),
        price_per_day: parsedPrice,
        location: location.trim(),
        seats: parsedSeats,
        transmission: transmission.trim(),
        fuel_type: fuelType.trim(),
        description: description.trim(),
        car_image_url: publicUrl,
        is_available: isAvailable,
      },
    ]);

    if (insertError) {
      console.error("Vehicle insert error:", insertError.message);
      setErrorMessage(insertError.message || "Failed to save vehicle.");
      setSubmitting(false);
      return;
    }

    setSuccessMessage("Vehicle added successfully.");

    setName("");
    setBrand("");
    setModel("");
    setVehicleType("");
    setPricePerDay("");
    setLocation("");
    setSeats("");
    setTransmission("");
    setFuelType("");
    setDescription("");
    setIsAvailable(true);
    setImageFile(null);
    setSubmitting(false);

    router.push("/rent");
    router.refresh();
  }

  if (checkingAccess) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-white/60">Checking admin access...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6 md:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/45">
            Admin Panel
          </p>
          <h1 className="text-2xl font-bold text-white">Login Required</h1>
          <p className="mt-3 leading-7 text-white/65">
            You need to be logged in with the owner admin account before you can
            add rental vehicles.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-[#08141b] transition hover:bg-green-400"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6 md:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/45">
            Admin Panel
          </p>
          <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
          <p className="mt-3 leading-7 text-white/65">
            You are logged in, but this account is not marked as an admin in your
            database.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-[#08141b] transition hover:bg-green-400"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/45">
          Admin Panel
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Add Rental Car
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
          Upload a rental vehicle with image and full details for display on the
          rent page.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0d1c24] p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Vehicle Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Toyota Corolla 2020"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="e.g. Toyota"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="e.g. Corolla"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Vehicle Type
              </label>
              <input
                type="text"
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                placeholder="e.g. Sedan, SUV"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Price per Day (₦)
              </label>
              <input
                type="number"
                min="1"
                value={pricePerDay}
                onChange={(event) => setPricePerDay(event.target.value)}
                placeholder="e.g. 25000"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Abuja"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Seats
              </label>
              <input
                type="number"
                min="1"
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Transmission
              </label>
              <input
                type="text"
                value={transmission}
                onChange={(event) => setTransmission(event.target.value)}
                placeholder="e.g. Automatic"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Fuel Type
              </label>
              <input
                type="text"
                value={fuelType}
                onChange={(event) => setFuelType(event.target.value)}
                placeholder="e.g. Petrol"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Vehicle Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] || null)
                }
                className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-green-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#08141b]"
              />
            </div>

            <div className="flex items-center gap-3 pt-8">
              <input
                id="isAvailable"
                type="checkbox"
                checked={isAvailable}
                onChange={(event) => setIsAvailable(event.target.checked)}
                className="h-4 w-4"
              />
              <label
                htmlFor="isAvailable"
                className="text-sm font-medium text-white/80"
              >
                Available for booking
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the vehicle, comfort, condition, use case, etc."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-green-400"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-green-500 px-6 py-3.5 text-sm font-semibold text-[#08141b] transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding Vehicle..." : "Add Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}