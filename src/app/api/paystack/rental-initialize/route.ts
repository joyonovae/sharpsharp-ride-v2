import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function rentalDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
}

export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) return NextResponse.json({ status: false, message: "Paystack secret key is missing." }, { status: 500 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ status: false, message: "Please log in before booking." }, { status: 401 });
    const { data: accountProfile } = await supabase.from("profiles").select("account_status").eq("id", user.id).single();
    if (accountProfile?.account_status && accountProfile.account_status !== "active") return NextResponse.json({ status: false, message: "Your account is suspended." }, { status: 403 });
    const body = await request.json();
    const vehicleId = String(body.vehicleId || "").trim();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || "").trim();
    const pickupLocation = String(body.pickupLocation || "").trim();
    const returnLocation = String(body.returnLocation || "").trim();
    const notes = String(body.notes || "").trim();
    const days = rentalDays(startDate, endDate);
    const today = new Date().toISOString().slice(0, 10);
    if (!vehicleId || !fullName || !phone || !pickupLocation || !returnLocation || days < 1 || startDate < today) {
      return NextResponse.json({ status: false, message: "Please provide valid rental details and future dates." }, { status: 400 });
    }
    const { data: vehicle, error } = await supabase.from("vehicles").select("id, price_per_day, is_available").eq("id", vehicleId).eq("is_available", true).single();
    if (error || !vehicle) return NextResponse.json({ status: false, message: "Rental vehicle is not available." }, { status: 404 });
    const admin = createAdminClient();
    const { data: conflict } = await admin.from("rental_bookings").select("id").eq("vehicle_id", vehicleId).eq("payment_status", "paid").in("booking_status", ["confirmed", "completed"]).lte("start_date", endDate).gte("end_date", startDate).limit(1).maybeSingle();
    if (conflict) return NextResponse.json({ status: false, message: "This vehicle is already booked for the selected dates." }, { status: 409 });
    const amount = Math.round(Number(vehicle.price_per_day) * days * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ status: false, message: "Rental price is invalid." }, { status: 400 });
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.sharpsharpride.com").replace(/\/+$/, "");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email, amount, currency: "NGN", callback_url: `${siteUrl}/rent/booking-success`,
        metadata: { type: "rental_booking", vehicleId, userId: user.id, fullName, phone, startDate, endDate, rentalDays: days, totalAmount: amount / 100, pickupLocation, returnLocation, notes },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.status) return NextResponse.json({ status: false, message: data.message || "Could not initialize rental payment." }, { status: 400 });
    return NextResponse.json({ status: true, authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    console.error("Rental Paystack initialization failed:", error);
    return NextResponse.json({ status: false, message: error instanceof Error ? error.message : "Server error." }, { status: 500 });
  }
}
