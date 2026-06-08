import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/requireAdmin";

export default async function AdminUsersPage() {
  const { admin } = await requireAdminPage();
  const [{ data: profiles }, authUsers] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, phone, role, driver_status")
      .order("full_name", { ascending: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
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
            Read-only account overview. Driver role changes stay tied to the driver application workflow.
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
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Info label="Phone" value={profile.phone} />
                  <Info label="Driver Status" value={profile.driver_status || "none"} />
                  <Info label="Joined" value={auth?.createdAt ? new Date(auth.createdAt).toLocaleDateString() : "Not available"} />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 break-words font-bold">{value ? String(value) : "Not provided"}</p></div>;
}
