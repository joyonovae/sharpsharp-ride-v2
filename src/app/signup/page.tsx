import Link from "next/link";
import { signupWithGoogle, signupWithMagicLink } from "./actions";
import { getSafeNextPath } from "@/lib/auth/redirects";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const next = getSafeNextPath(params?.next);

  return (
    <section className="min-h-screen bg-[linear-gradient(135deg,#031326_0%,#051a33_42%,#062445_100%)] px-5 py-16 text-white lg:px-8">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
        <h1 className="text-4xl font-black">Create Account</h1>

        <p className="mt-3 text-slate-300">
          Create your SharpSharp Ride account.
        </p>

        {params?.message && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {params.message}
          </div>
        )}

        {params?.error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <form action={signupWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button className="h-12 w-full rounded-full bg-white font-bold text-[#061116]">
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form action={signupWithMagicLink} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white"
            />

            <button className="h-12 w-full rounded-full bg-[#18c37e] font-bold text-[#04130c]">
              Create with email
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[#18c37e] underline">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
