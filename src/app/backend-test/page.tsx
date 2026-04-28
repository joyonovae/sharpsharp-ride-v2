import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function BackendTestPage() {
  let status: "connected" | "missing-env" | "error" = "connected";
  let message = "Supabase server client created successfully.";

  try {
    await createServerSupabaseClient();
  } catch (error) {
    if (error instanceof Error && error.message.includes("environment variables")) {
      status = "missing-env";
      message =
        "Supabase environment variables are missing. Add them to .env.local and restart the dev server.";
    } else {
      status = "error";
      message = "Supabase client setup failed with an unexpected error.";
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-24 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#18c37e]">
            Backend Test
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Supabase setup check
          </h1>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Status</p>
            <p
              className={`mt-2 text-lg font-bold ${
                status === "connected"
                  ? "text-[#18c37e]"
                  : status === "missing-env"
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {status}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">What to do next</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7 text-slate-700">
              <li>Add your Supabase URL and anon key to <code>.env.local</code></li>
              <li>Restart the app</li>
              <li>Open <code>/backend-test</code></li>
              <li>Confirm the status shows <strong>connected</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}