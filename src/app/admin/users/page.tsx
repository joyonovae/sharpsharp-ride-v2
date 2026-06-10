import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { reinstateUser, rejectSuspensionReview, suspendUser } from "./actions";

export default async function AdminUsersPage() {
  const { admin } = await requireAdminPage();
  const [{ data: profiles }, authUsers, { data: reviewRequests }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, phone, role, driver_status, account_status, suspension_reason")
      .order("full_name", { ascending: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("suspension_review_requests").select("*").order("created_at", { ascending: false }),
  ]);

  const emailById = new Map(
    (authUsers.data.users || []).map((user) => [
      user.id,
      { email: user.email, createdAt: user.created_at },
    ])
  );

  return (
    <main className="min-h-screen bg-[#061116] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/admin" className="text-sm font-bold text-emerald-400">Back to admin</Link>
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0b1d33,#071820)] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">User Management</p>
          <h1 className="mt-4 text-4xl font-black">Users and Roles</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Suspend or reinstate non-admin users while preserving their history.
          </p>
        </section>

        <section className="grid gap-4">
          {(profiles || []).map((profile) => {
            const auth = emailById.get(profile.id);
            return (
              <div key={profile.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{profile.full_name || "Unnamed user"}</h2>
                    <p className="mt-1 text-sm text-slate-400">{auth?.email || "No auth email"}</p>
                  </div>
                  <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase text-emerald-300">
                    {profile.role || "passenger"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Info label="Phone" value={profile.phone} />
                  <Info label="Driver Status" value={profile.driver_status || "none"} />
                  <Info label="Account Status" value={profile.account_status || "active"} />
                  <Info label="Joined" value={auth?.createdAt ? new Date(auth.createdAt).toLocaleDateString() : "Not available"} />
                </div>
                {profile.suspension_reason && <p className="mt-3 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">Reason: {profile.suspension_reason}</p>}
                {profile.role !== "admin" && <div className="mt-4">{profile.account_status === "active" || !profile.account_status ? <form action={suspendUser} className="flex flex-wrap gap-2"><input type="hidden" name="userId" value={profile.id}/><select name="status" className="rounded-full bg-[#0b1d26] px-4 py-3"><option value="suspended">Suspend</option><option value="blocked">Block</option></select><input name="reason" required placeholder="Reason" className="rounded-full border border-white/15 bg-white/5 px-4 py-3"/><button className="rounded-full border border-red-400/30 px-5 py-3 font-bold text-red-300">Apply Restriction</button></form> : <form action={reinstateUser}><input type="hidden" name="userId" value={profile.id}/><button className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Reinstate User</button></form>}</div>}
              </div>
            );
          })}
        </section>
        <section><h2 className="text-2xl font-black">Suspension Review Requests</h2><div className="mt-4 grid gap-4">{!reviewRequests?.length ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6">No review requests.</div> : reviewRequests.map((request) => <div key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-5"><div className="flex justify-between"><strong>{request.status}</strong><span className="text-sm text-slate-400">{new Date(request.created_at).toLocaleString()}</span></div><p className="mt-3">{request.explanation}</p>{request.status === "pending" && <div className="mt-4 flex flex-wrap gap-3"><form action={reinstateUser}><input type="hidden" name="userId" value={request.user_id}/><button className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-[#04130c]">Approve and Reinstate</button></form><form action={rejectSuspensionReview} className="flex gap-2"><input type="hidden" name="requestId" value={request.id}/><input name="adminNote" placeholder="Admin note" className="rounded-full border border-white/15 bg-white/5 px-4"/><button className="rounded-full border border-red-400/30 px-5 py-3 font-bold text-red-300">Reject Review</button></form></div>}</div>)}</div></section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 break-words font-bold">{value ? String(value) : "Not provided"}</p></div>;
}
