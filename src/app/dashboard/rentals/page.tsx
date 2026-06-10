import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RentalApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/rentals");
  const { data: applications } = await supabase.from("rental_vehicle_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-3xl font-black">My Rental Applications</h1><Link href="/rent/submit" className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Submit Vehicle</Link></div>
    {!applications?.length ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6">No rental applications yet.</div> :
      applications.map((app) => <div key={app.id} className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex justify-between gap-4"><h2 className="text-xl font-black">{app.brand} {app.model}</h2><span className="uppercase text-emerald-300">{app.status}</span></div><p className="mt-2 text-slate-400">{app.location} · NGN {Number(app.price_per_day).toLocaleString()}/day</p>{app.admin_note && <p className="mt-3 text-sm text-white/70">{app.admin_note}</p>}</div>)
    }
  </div></main>;
}
