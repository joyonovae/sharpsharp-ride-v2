"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ApplyDriverPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [seatCount, setSeatCount] = useState("");
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("Please log in again and try once more.");
        router.push("/login?next=/apply/driver");
        setSubmitting(false);
        return;
      }

      if (!vehicleImage) {
        setErrorMessage("Please upload a vehicle image.");
        setSubmitting(false);
        return;
      }

      const fileExt = vehicleImage.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-vehicles")
        .upload(filePath, vehicleImage, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setErrorMessage(uploadError.message || "Vehicle image upload failed.");
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("driver-vehicles")
        .getPublicUrl(filePath);

      const uploadedVehicleImageUrl = publicUrlData.publicUrl;

      const { error: applicationError } = await supabase
        .from("driver_applications")
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone,
          address,
          city,
          license_number: licenseNumber,
          car_type: vehicleType,
          vehicle_brand: vehicleBrand,
          vehicle_model: vehicleModel,
          vehicle_color: vehicleColor,
          plate_number: plateNumber,
          seat_count: Number(seatCount),
          vehicle_image_url: uploadedVehicleImageUrl,
          status: "pending",
        });

      if (applicationError) {
        setErrorMessage(applicationError.message || "Could not submit application.");
        setSubmitting(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ driver_status: "pending" })
        .eq("id", user.id);

      if (profileError) {
        setErrorMessage(
          profileError.message || "Application saved, but profile update failed."
        );
        setSubmitting(false);
        return;
      }

      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Driver Application Submitted",
        message:
          "Your driver application has been received and is currently under review.",
        type: "driver_application",
        link: "/apply/driver/review",
        is_read: false,
      });

      if (notificationError) {
        console.error("Driver application notification failed:", notificationError);
      }

      const emailResponse = await fetch("/api/emails/driver-application-submitted", {
        method: "POST",
      });

      if (!emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.error("Driver application email failed:", emailResult);
      }

      window.location.href = "/apply/driver/review";
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-[linear-gradient(135deg,#031326_0%,#051a33_42%,#062445_100%)] px-5 py-14 text-white lg:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
          <h1 className="text-4xl font-black">Apply as a Driver</h1>
          <p className="mt-3 text-lg text-slate-300">
            Fill in your driver details and vehicle details. Once submitted,
            your application will go under review before you can offer rides.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white">Driver Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Driver's license number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <textarea placeholder="Home address" value={address} onChange={(e) => setAddress(e.target.value)} required className="min-h-[120px] rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none placeholder:text-slate-400 md:col-span-2" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Vehicle Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Vehicle type (e.g. Sedan, SUV)" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Vehicle brand" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Vehicle model" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Vehicle color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Plate number" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="number" min="1" placeholder="Number of seats" value={seatCount} onChange={(e) => setSeatCount(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-white">
                    Upload vehicle image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setVehicleImage(e.target.files?.[0] ?? null)}
                    className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#18c37e] file:px-5 file:py-2 file:font-semibold file:text-[#04130c]"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#18c37e] px-6 text-lg font-bold text-[#04130c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Driver Application"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
