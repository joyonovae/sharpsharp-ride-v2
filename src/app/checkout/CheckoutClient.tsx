"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Ride = {
  id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  travel_time: string;
  price_per_seat: number;
  available_seats: number;
  pickup_point: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const type = searchParams.get("type");
  const rideId = searchParams.get("rideId");

  const [ride, setRide] = useState<Ride | null>(null);
  const [userId, setUserId] = useState("");
  const [loadingRide, setLoadingRide] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCheckout() {
      if (type !== "ride" || !rideId) {
        setLoadingRide(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        router.push(
          `/login?next=${encodeURIComponent(
            `/checkout?type=ride&rideId=${rideId}`
          )}`
        );
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("rides")
        .select(
          "id, from_city, to_city, travel_date, travel_time, price_per_seat, available_seats, pickup_point"
        )
        .eq("id", rideId)
        .single();

      if (error || !data) {
        setErrorMessage("Ride not found.");
        setLoadingRide(false);
        return;
      }

      setRide(data);
      setLoadingRide(false);
    }

    loadCheckout();
  }, [type, rideId, supabase, router]);

  const totalAmount = ride ? seats * Number(ride.price_per_seat) : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ride) {
      setErrorMessage("Ride details could not be loaded.");
      return;
    }

    if (!userId) {
      setErrorMessage("Please login again before booking.");
      router.push(
        `/login?next=${encodeURIComponent(
          `/checkout?type=ride&rideId=${ride.id}`
        )}`
      );
      return;
    }

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage("Please enter your full name, phone number, and email.");
      return;
    }

    if (seats < 1 || seats > ride.available_seats) {
      setErrorMessage(`You can only book up to ${ride.available_seats} seat(s).`);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: totalAmount,
          rideId: ride.id,
          userId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          seats,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        setErrorMessage(data.message || "Payment initialization failed.");
        setSubmitting(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch (error: any) {
      setErrorMessage(error.message || "Payment error.");
      setSubmitting(false);
    }
  }

  if (loadingRide) {
    return <div className="p-10 text-white/60">Loading checkout...</div>;
  }

  if (type !== "ride" || !rideId || !ride) {
    return (
      <div className="p-10 text-red-400">
        Ride not found or checkout link is invalid.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 text-white">
      <h1 className="mb-6 text-3xl font-bold">Complete Booking</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl bg-black/30 p-3"
            required
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl bg-black/30 p-3"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-black/30 p-3"
            required
          />

          <input
            type="number"
            min={1}
            max={ride.available_seats}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="w-full rounded-xl bg-black/30 p-3"
            required
          />

          <p className="text-sm text-white/60">
            Available seats: {ride.available_seats}
          </p>

          {errorMessage && <p className="text-red-400">{errorMessage}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-green-500 py-3 font-bold text-black disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Pay with Paystack"}
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-bold">Summary</h2>

          <p>
            {ride.from_city} → {ride.to_city}
          </p>
          <p>{ride.travel_date}</p>
          <p>{ride.travel_time}</p>
          <p>Pickup: {ride.pickup_point}</p>
          <p>Seats: {seats}</p>

          <div className="mt-4 text-2xl font-bold text-green-400">
            ₦{totalAmount}
          </div>
        </div>
      </div>
    </div>
  );
}