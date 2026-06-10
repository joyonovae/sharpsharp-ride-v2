import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { updateRentalBookingStatus } from "./actions";

export default async function AdminRentalBookingsPage() {
  const { admin } = await requireAdminPage();
  const { data: bookings } = await admin.from("rental_bookings").select("*, vehicles(name, brand, model)").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Admin Panel</p><h1 className="mt-3 text-4xl font-black">Rental Bookings</h1></div>
    <p className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">Cancelling a paid booking records the operational cancellation but does not automatically issue a Paystack refund.</p>
    {!bookings?.length ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8">No rental bookings yet.</div> : bookings.map((booking) => {
      const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
      return <article key={booking.id} className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-2xl font-black">{vehicle?.name || `${vehicle?.brand || ""} ${vehicle?.model || ""}`}</h2><p className="mt-2 text-slate-400">{booking.full_name} · {booking.start_date} to {booking.end_date}</p></div><span className="h-fit rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase text-emerald-300">{booking.payment_status} / {booking.booking_status}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><Info label="Phone" value={booking.phone}/><Info label="Pickup" value={booking.pickup_location}/><Info label="Days" value={booking.rental_days}/><Info label="Total" value={`NGN ${Number(booking.total_amount).toLocaleString()}`}/></div>{booking.booking_status === "confirmed" && <form action={updateRentalBookingStatus} className="mt-5 flex gap-3"><input type="hidden" name="bookingId" value={booking.id}/><button name="status" value="completed" className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Mark Completed</button><button name="status" value="cancelled" className="rounded-full border border-red-400/30 px-5 py-3 font-bold text-red-300">Cancel Booking</button></form>}</article>;
    })}
  </div></main>;
}
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-bold">{String(value || "Not provided")}</p></div>; }
