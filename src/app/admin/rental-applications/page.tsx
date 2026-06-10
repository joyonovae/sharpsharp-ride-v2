import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { approveRentalApplication, rejectRentalApplication } from "./actions";

export default async function AdminRentalApplicationsPage() {
  const { admin } = await requireAdminPage();
  const { data: applications } = await admin.from("rental_vehicle_applications").select("*").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-6xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Admin Panel</p><h1 className="mt-3 text-4xl font-black">Rental Applications</h1></div>
    {!applications?.length ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8">No rental applications yet.</div> :
      applications.map((app) => <article key={app.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-2xl font-black">{app.brand} {app.model}</h2><p className="mt-2 text-slate-400">{app.owner_name} · {app.location} · NGN {Number(app.price_per_day).toLocaleString()}/day</p></div><span className="uppercase text-emerald-300">{app.status}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Phone" value={app.phone}/><Info label="Plate" value={app.plate_number}/><Info label="Seats" value={app.seats}/></div>
        {app.status === "pending" && <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <form action={approveRentalApplication} className="space-y-3"><input type="hidden" name="applicationId" value={app.id}/><input name="adminNote" placeholder="Optional admin note" className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3"/><button className="w-full rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Approve and Publish</button></form>
          <form action={rejectRentalApplication} className="space-y-3"><input type="hidden" name="applicationId" value={app.id}/><input name="adminNote" placeholder="Reason / admin note" className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3"/><button className="w-full rounded-full border border-red-400/30 px-5 py-3 font-bold text-red-300">Reject</button></form>
        </div>}
      </article>)
    }
  </div></main>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 font-bold">{String(value || "Not provided")}</p></div>;
}
