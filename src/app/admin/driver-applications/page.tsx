import { createClient } from "@/lib/supabase/server";
import { approveDriver } from "./actions";

export default async function AdminDriverApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔒 Protect page
  if (!user || user.email !== "onovaejoy4@gmail.com") {
    return (
      <div className="p-10 text-red-400">
        Access denied. Admin only.
      </div>
    );
  }

  const { data: applications } = await supabase
    .from("driver_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Driver Applications
      </h1>

      {!applications || applications.length === 0 ? (
        <p>No applications yet</p>
      ) : (
        <div className="space-y-6">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="bg-white/5 p-6 rounded-xl border border-white/10"
            >
              <p><strong>Name:</strong> {app.full_name}</p>
              <p><strong>Phone:</strong> {app.phone}</p>
              <p><strong>Plate:</strong> {app.plate_number}</p>
              <p><strong>Status:</strong> {app.status}</p>

              {app.status === "pending" && (
                <form action={approveDriver}>
                  <input type="hidden" name="appId" value={app.id} />
                  <input type="hidden" name="userId" value={app.user_id} />

                  <button className="mt-4 bg-green-500 px-4 py-2 rounded">
                    Approve
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}