"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);
    }
    loadProfile();
  }, [supabase]);

  function continueFromDriverDetails() {
    if (!fullName.trim() || !phone.trim() || !city.trim() || !licenseNumber.trim() || !address.trim() || !passportPhoto) {
      setErrorMessage("Complete your driver details before continuing.");
      return;
    }
    setErrorMessage("");
    setStep(2);
  }

  function continueFromVehicleDetails() {
    if (!vehicleType || !vehicleBrand.trim() || !vehicleModel.trim() || !vehicleColor.trim() || !plateNumber.trim() || !seatCount || !vehicleImage) {
      setErrorMessage("Complete the required vehicle details and upload an image.");
      return;
    }
    if (!Number.isInteger(Number(seatCount)) || Number(seatCount) < 1) {
      setErrorMessage("Passenger seats must be a whole number of at least 1.");
      return;
    }
    setErrorMessage("");
    setStep(3);
  }

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
      const { data: accountProfile } = await supabase.from("profiles").select("account_status").eq("id", user.id).single();
      if (accountProfile?.account_status && accountProfile.account_status !== "active") { setErrorMessage("Your account is suspended. Request a review from your dashboard."); setSubmitting(false); return; }

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
      if (!passportPhoto) { setErrorMessage("Please upload a passport photograph."); setSubmitting(false); return; }
      if (!passportPhoto.type.startsWith("image/")) { setErrorMessage("Passport photograph must be an image."); setSubmitting(false); return; }
      if (passportPhoto.size > 8 * 1024 * 1024) { setErrorMessage("Passport photograph must be 8 MB or smaller."); setSubmitting(false); return; }
      const passportPath = `${user.id}/${Date.now()}.${passportPhoto.name.split(".").pop()}`;
      const { error: passportError } = await supabase.storage.from("driver-passports").upload(passportPath, passportPhoto, { upsert: false });
      if (passportError) { setErrorMessage(passportError.message || "Passport upload failed."); setSubmitting(false); return; }

      const { data: application, error: applicationError } = await supabase
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
          passport_photo_url: passportPath,
          status: "pending",
        })
        .select("id")
        .single();

      if (applicationError || !application) {
        setErrorMessage(
          applicationError?.message || "Could not submit application."
        );
        setSubmitting(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ driver_status: "pending" })
        .eq("id", user.id);

      if (profileError) {
        console.error("Driver profile status update failed:", profileError);
      }

      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Driver Application Submitted",
        message:
          "Your driver application has been received and is currently under review.",
        type: "driver_application",
        link: "/apply/driver/review",
        dedupe_key: `driver_application_submitted:${application.id}`,
        is_read: false,
      });

      if (notificationError) {
        console.error("Driver application notification failed:", notificationError);
      }

      try {
        const emailResponse = await fetch(
          "/api/emails/driver-application-submitted",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              applicationId: application.id,
            }),
          }
        );

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok || !emailResult.success) {
          console.error("Driver application email failed:", emailResult);
        }
      } catch (emailError) {
        console.error("Driver application email request failed:", emailError);
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
            Complete three short steps. Your application will be reviewed before you can offer rides.
          </p>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">Step {step} of 3</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {step === 1 && <div>
              <h2 className="text-xl font-bold text-white">Driver Details</h2>
              <p className="mt-2 text-sm text-slate-400">Use details that match your driver documents. Your saved profile details are filled where available.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Driver's license number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <textarea placeholder="Home address" value={address} onChange={(e) => setAddress(e.target.value)} required className="min-h-[120px] rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none placeholder:text-slate-400 md:col-span-2" />
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 md:col-span-2"><label className="font-semibold">Passport photograph</label><p className="mt-1 text-xs text-slate-400">Required for private admin verification. It is not shown publicly.</p><input type="file" accept="image/*" required onChange={(e) => setPassportPhoto(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#18c37e] file:px-5 file:py-2 file:font-semibold file:text-[#04130c]"/></div>
              </div>
              <button type="button" onClick={continueFromDriverDetails} className="mt-6 h-14 w-full rounded-2xl bg-[#18c37e] font-bold text-[#04130c]">Continue to Vehicle Details</button>
            </div>}

            {step === 2 && <div>
              <h2 className="text-xl font-bold text-white">Vehicle Details</h2>
              <p className="mt-2 text-sm text-slate-400">Enter the vehicle you intend to use for SharpSharp rides.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-[#0b1d26] px-4 text-white outline-none"><option value="">Select vehicle type</option><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Minivan</option><option>Bus</option><option>Other</option></select>
                <input type="text" placeholder="Vehicle brand" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Vehicle model" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Vehicle color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="text" placeholder="Plate number" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-slate-400" />
                <input type="number" min="1" step="1" placeholder="Passenger seats" value={seatCount} onChange={(e) => setSeatCount(e.target.value)} required className="h-14 rounded-2xl border border-white/10 bg-[#0b1d26] px-4 text-white outline-none placeholder:text-slate-400" />

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-white">
                    Upload vehicle image
                  </label>
                  <p className="mt-1 text-xs text-slate-400">Use a clear exterior photo showing the vehicle condition.</p>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setVehicleImage(e.target.files?.[0] ?? null)}
                    className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#18c37e] file:px-5 file:py-2 file:font-semibold file:text-[#04130c]"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3"><button type="button" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl border border-white/15 font-bold">Back</button><button type="button" onClick={continueFromVehicleDetails} className="h-14 flex-1 rounded-2xl bg-[#18c37e] font-bold text-[#04130c]">Review Application</button></div>
            </div>}

            {step === 3 && <div>
              <h2 className="text-xl font-bold">Review Application</h2>
              <p className="mt-2 text-sm text-slate-400">Check these details before submitting for admin review.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Review label="Driver" value={fullName}/><Review label="Phone" value={phone}/><Review label="City" value={city}/><Review label="Vehicle" value={`${vehicleBrand} ${vehicleModel}`}/><Review label="Type / Color" value={`${vehicleType} / ${vehicleColor}`}/><Review label="Plate / Seats" value={`${plateNumber} / ${seatCount}`}/>
              </div>
              <div className="mt-6 flex gap-3"><button type="button" onClick={() => setStep(2)} className="h-14 flex-1 rounded-2xl border border-white/15 font-bold">Edit Details</button><button type="submit" disabled={submitting} className="h-14 flex-1 rounded-2xl bg-[#18c37e] font-bold text-[#04130c] disabled:opacity-70">{submitting ? "Submitting..." : "Submit Application"}</button></div>
            </div>}

            {errorMessage && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

          </form>
        </div>
      </div>
    </section>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
