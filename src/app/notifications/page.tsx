import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function getTypeLabel(type?: string | null) {
  if (type === "ride_assigned") return "Ride Assigned";
  if (type === "ride_request_matched") return "Ride Matched";
  if (type === "ride_request_cancelled") return "Ride Cancelled";
  if (type === "driver_application") return "Driver Application";
  if (type === "booking_confirmed") return "Booking Confirmed";
  if (type === "passenger_booking") return "Passenger Booking";
  if (type?.startsWith("admin_")) return "Admin Operations";
  return "Notification";
}

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { error: markReadError } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (markReadError) {
    console.error("Could not mark notifications as read:", markReadError.message);
  }

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-bold text-emerald-400 hover:text-emerald-300"
        >
          ← Back to dashboard
        </Link>

        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
            <Bell className="h-7 w-7" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            Notifications
          </p>

          <h1 className="mt-3 text-4xl font-black">Your Updates</h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            See updates about your ride requests, assigned rides, bookings,
            and account activity.
          </p>
        </section>

        {!notifications || notifications.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />

            <h2 className="mt-5 text-2xl font-black">
              No notifications yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Updates will appear here when something important happens on your
              account.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {notifications.map((notification: any) => (
              <Link
                key={notification.id}
                href={notification.link || "/dashboard"}
                className="block rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                      {getTypeLabel(notification.type)}
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                      {notification.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <span className="w-fit rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-[#04130c]">
                      New
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
