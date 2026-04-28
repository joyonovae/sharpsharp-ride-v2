"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  role: string | null;
};

const NAV_LOGO = "/logos/navbar-logo.png";

export default function Navbar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;

      if (!mounted) return;

      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle<ProfileRow>();

        if (!mounted) return;
        setUserRole(profile?.role ?? null);
      } else {
        setUserRole(null);
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle<ProfileRow>()
          .then(({ data }) => {
            if (mounted) setUserRole(data?.role ?? null);
          });
      } else {
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setUserRole(null);
    setOpen(false);

    router.replace("/");
    router.refresh();
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#08141b]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src={NAV_LOGO}
            alt="SharpSharp Ride logo"
            width={170}
            height={52}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/" className="text-white/80 hover:text-blue-400">
            Home
          </Link>

          <Link href="/rides" className="text-white/80 hover:text-green-400">
            Book a Ride
          </Link>

          <Link
            href="/offer-a-ride"
            className="font-semibold text-white/80 hover:text-yellow-400"
          >
            Offer a Ride
          </Link>

          <Link href="/rent" className="text-white/80 hover:text-purple-400">
            Rent a Car
          </Link>

          <Link href="/delivery" className="text-white/80 hover:text-pink-400">
            Delivery
          </Link>

          <Link
  href="/faq"
  className="text-white/80 transition hover:text-orange-400 hover:scale-105"
>
  FAQ
</Link>

          {userRole === "admin" && (
            <Link
              href="/admin/driver-applications"
              className="text-white/80 hover:text-red-400"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white"
              >
                Account
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#0d1c24] p-3 shadow-lg">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-white hover:text-emerald-400"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/bookings"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-white hover:text-emerald-400"
                  >
                    My Bookings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 w-full text-left text-red-400"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-[#18c37e] px-5 py-2 text-sm font-semibold text-[#04130c]"
              >
                Get Started
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}