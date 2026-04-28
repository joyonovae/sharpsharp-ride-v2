"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Home, Loader2, XCircle } from "lucide-react";

type VerifyState = "verifying" | "success" | "error";

export default function BookingSuccessClient({
  reference,
}: {
  reference: string;
}) {
  const [state, setState] = useState<VerifyState>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [details, setDetails] = useState<{
    reference?: string;
    rideId?: string;
    seats?: number;
  }>({});

  useEffect(() => {
    async function verifyPayment() {
      if (!reference) {
        setState("error");
        setErrorMessage("Payment reference is missing.");
        return;
      }

      try {
        const response = await fetch("/api/ride-bookings/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setState("error");
          setErrorMessage(data.error || "Payment verification failed.");
          return;
        }

        setDetails({
          reference: data.reference,
          rideId: data.rideId,
          seats: data.seats,
        });

        setState("success");
      } catch {
        setState("error");
        setErrorMessage("Something went wrong while verifying payment.");
      }
    }

    verifyPayment();
  }, [reference]);

  return (
    <main className="min-h-screen bg-[#061116] px-5 py-14 text-white lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center md:p-10">
        {state === "verifying" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <Loader2 className="h-10 w-10 animate-spin text-yellow-300" />
            </div>
            <h1 className="mt-6 text-3xl font-black">
              Verifying your payment...
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              Please wait while we confirm your payment and save your booking.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-300" />
            </div>

            <h1 className="mt-6 text-4xl font-black">
              Your ride was booked successfully
            </h1>

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              <Info label="Reference" value={details.reference || "N/A"} />
              <Info label="Seats" value={String(details.seats || "N/A")} />
              <Info label="Status" value="Paid" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/bookings"
                className="rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]"
              >
                View My Bookings
              </Link>

              <Link
                href="/rides"
                className="rounded-full border border-white/15 px-6 py-3 font-bold text-white"
              >
                Browse More Rides
              </Link>

              <Link
                href="/"
                className="rounded-full border border-white/15 px-6 py-3 font-bold text-white"
              >
                <Home className="mr-2 inline h-4 w-4" />
                Home
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-10 w-10 text-red-300" />
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Payment verification failed
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-red-200">
              {errorMessage}
            </p>

            <div className="mt-8">
              <Link
                href="/rides"
                className="rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c]"
              >
                Try Again
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-white">{value}</p>
    </div>
  );
}