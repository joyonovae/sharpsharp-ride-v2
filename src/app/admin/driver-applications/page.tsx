import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveDriver, rejectDriver } from "./actions";
import ApproveDriverButton from "./ApproveDriverButton";
import {
  Car,
  CheckCircle2,
  Clock,
  IdCard,
  MapPin,
  Phone,
  User,
  XCircle,
} from "lucide-react";

function getStatusStyle(status?: string | null) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
}

export default async function AdminDriverApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: applications } = await supabase
    .from("driver_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const apps = applications || [];

  const pendingCount = apps.filter((app) => app.status === "pending").length;
  const approvedCount = apps.filter((app) => app.status === "approved").length;
  const rejectedCount = apps.filter((app) => app.status === "rejected").length;

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            Admin Panel
          </p>

          <h1 className="mt-4 text-4xl font-black">
            Driver Applications
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Review driver details, vehicle information, documents, and approve
            verified drivers to create rides.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard title="Pending" value={pendingCount} />
            <StatCard title="Approved" value={approvedCount} />
            <StatCard title="Rejected" value={rejectedCount} />
          </div>
        </section>

        {apps.length === 0 ? (
          <section className="rounded-[1.7rem] border border-dashed border-white/15 bg-white/5 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
              <Car className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No driver applications yet
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Driver applications will appear here once users apply to become
              SharpSharp Ride drivers.
            </p>
          </section>
        ) : (
          <section className="grid gap-6">
            {apps.map((app: any) => (
              <article
                key={app.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5"
              >
                <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="border-b border-white/10 bg-white/[0.03] p-5 lg:border-b-0 lg:border-r">
                    <div className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08141b]">
                      {app.vehicle_image_url ? (
                        <Image
                          src={app.vehicle_image_url}
                          alt={`${app.vehicle_brand || "Vehicle"} image`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-[260px] items-center justify-center text-slate-500">
                          No vehicle image
                        </div>
                      )}
                    </div>

                    {app.passport_photo_url && (
                      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                          Passport Photo
                        </p>

                        <div className="relative h-40 overflow-hidden rounded-2xl bg-[#08141b]">
                          <Image
                            src={app.passport_photo_url}
                            alt={`${app.full_name || "Driver"} passport photo`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
                          Driver Candidate
                        </p>

                        <h2 className="mt-2 break-words text-3xl font-black">
                          {app.full_name || "Unnamed Applicant"}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                          Applied on{" "}
                          {app.created_at
                            ? new Date(app.created_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider ${getStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status || "pending"}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoCard
                        icon={<Phone className="h-5 w-5" />}
                        label="Phone"
                        value={app.phone || "—"}
                      />
                      <InfoCard
                        icon={<MapPin className="h-5 w-5" />}
                        label="City"
                        value={app.city || "—"}
                      />
                      <InfoCard
                        icon={<IdCard className="h-5 w-5" />}
                        label="License"
                        value={app.license_number || "—"}
                      />
                      <InfoCard
                        icon={<Car className="h-5 w-5" />}
                        label="Vehicle"
                        value={`${app.vehicle_brand || ""} ${
                          app.vehicle_model || ""
                        }`}
                      />
                      <InfoCard
                        icon={<Car className="h-5 w-5" />}
                        label="Plate Number"
                        value={app.plate_number || "—"}
                      />
                      <InfoCard
                        icon={<User className="h-5 w-5" />}
                        label="Seats"
                        value={app.seat_count || "—"}
                      />
                    </div>

                    {(app.address || app.additional_notes || app.admin_note) && (
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {app.address && (
                          <NoteBox title="Address" text={app.address} />
                        )}

                        {app.additional_notes && (
                          <NoteBox
                            title="Applicant Notes"
                            text={app.additional_notes}
                          />
                        )}

                        {app.admin_note && (
                          <NoteBox title="Admin Note" text={app.admin_note} />
                        )}
                      </div>
                    )}

                    {app.status === "pending" && (
                      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <ApproveDriverButton appId={app.id} />

                        <form action={rejectDriver}>
                          <input type="hidden" name="appId" value={app.id} />

                          <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-6 py-3 font-bold text-red-300 transition hover:bg-red-500/20 sm:w-auto">
                            <XCircle className="h-5 w-5" />
                            Reject
                          </button>
                        </form>
                      </div>
                    )}

                    {app.status === "approved" && (
                      <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 font-bold text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                        Driver approved
                      </div>
                    )}

                    {app.status === "rejected" && (
                      <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-5 py-3 font-bold text-red-300">
                        <XCircle className="h-5 w-5" />
                        Application rejected
                      </div>
                    )}

                    {app.status !== "pending" &&
                      app.status !== "approved" &&
                      app.status !== "rejected" && (
                        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-5 py-3 font-bold text-yellow-300">
                          <Clock className="h-5 w-5" />
                          Under review
                        </div>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-emerald-400">{value}</h3>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: unknown;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-emerald-400">
        {icon}
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words font-bold text-white">
        {value ? String(value) : "—"}
      </p>
    </div>
  );
}

function NoteBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">
        {title}
      </p>

      <p className="mt-2 break-words text-sm leading-7 text-slate-300">
        {text}
      </p>
    </div>
  );
}