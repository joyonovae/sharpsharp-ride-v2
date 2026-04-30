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
const ADMIN_EMAILS = ["onovaejoy4@gmail.com", "sharpsharptaxi@gmail.com"];

export default function Navbar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userEmail = user?.email?.toLowerCase() || "";
  const isAdmin = userRole === "admin" || ADMIN_EMAILS.includes(userEmail);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    setAccountOpen(false);
    setMobileOpen(false);

    router.replace("/");
    router.refresh();
  }

  function closeMenus() {
    setAccountOpen(false);
    setMobileOpen(false);
  }

  return (
    <nav className="sticky left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#08141b]/95 shadow-lg backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5 lg:px-8">
        <Link href="/" onClick={closeMenus} className="flex items-center">
          <div
            className={`transition-all duration-300 ${
              scrolled ? "scale-[0.92]" : "scale-100"
            }`}
          >
            <Image
              src={NAV_LOGO}
              alt="SharpSharp Ride logo"
              width={280}
              height={95}
              className={`w-auto object-contain transition-all duration-300 ${
                scrolled
                  ? "h-14 drop-shadow-[0_0_6px_rgba(24,195,126,0.25)]"
                  : "h-16 drop-shadow-[0_0_10px_rgba(24,195,126,0.35)] sm:h-20 lg:h-20"
              }`}
              priority
            />
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <NavLink href="/" color="hover:text-blue-400">
            Home
          </NavLink>

          <NavLink href="/rides" color="hover:text-green-400">
            Book a Ride
          </NavLink>

          <NavLink href="/offer-a-ride" color="hover:text-yellow-400" bold>
            Offer a Ride
          </NavLink>

          <NavLink href="/rent" color="hover:text-purple-400">
            Rent a Car
          </NavLink>

          <NavLink href="/delivery" color="hover:text-pink-400">
            Delivery
          </NavLink>

          <NavLink href="/faq" color="hover:text-orange-400">
            FAQ
          </NavLink>

          {isAdmin && (
            <NavLink href="/admin/driver-applications" color="hover:text-red-400">
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white"
              >
                Account
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-[#0d1c24] p-3 shadow-lg">
                  <Link
                    href="/dashboard"
                    onClick={closeMenus}
                    className="block py-2 text-white hover:text-emerald-400"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/bookings"
                    onClick={closeMenus}
                    className="block py-2 text-white hover:text-emerald-400"
                  >
                    My Bookings
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/driver-applications"
                      onClick={closeMenus}
                      className="block py-2 text-white hover:text-red-400"
                    >
                      Admin
                    </Link>
                  )}

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
            <div className="hidden items-center gap-3 md:flex">
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
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-bold text-white md:hidden"
            aria-label="Open menu"
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#08141b] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4 text-base font-semibold">
            <MobileLink href="/" onClick={closeMenus}>
              Home
            </MobileLink>

            <MobileLink href="/rides" onClick={closeMenus}>
              Book a Ride
            </MobileLink>

            <MobileLink href="/offer-a-ride" onClick={closeMenus}>
              Offer a Ride
            </MobileLink>

            <MobileLink href="/rent" onClick={closeMenus}>
              Rent a Car
            </MobileLink>

            <MobileLink href="/delivery" onClick={closeMenus}>
              Delivery
            </MobileLink>

            <MobileLink href="/faq" onClick={closeMenus}>
              FAQ
            </MobileLink>

            {isAdmin && (
              <MobileLink href="/admin/driver-applications" onClick={closeMenus}>
                Admin
              </MobileLink>
            )}

            <div className="mt-3 border-t border-white/10 pt-4">
              {!loading && user ? (
                <div className="flex flex-col gap-3">
                  <MobileLink href="/dashboard" onClick={closeMenus}>
                    Dashboard
                  </MobileLink>

                  <MobileLink href="/dashboard/bookings" onClick={closeMenus}>
                    My Bookings
                  </MobileLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-red-500 px-5 py-3 text-left font-bold text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : !loading ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenus}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center font-bold text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={closeMenus}
                    className="rounded-full bg-[#18c37e] px-5 py-3 text-center font-bold text-[#04130c]"
                  >
                    Get Started
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  children,
  color,
  bold,
}: {
  href: string;
  children: React.ReactNode;
  color: string;
  bold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-white/80 transition hover:scale-105 ${color} ${
        bold ? "font-semibold" : ""
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white hover:border-emerald-400/40 hover:text-emerald-400"
    >
      {children}
    </Link>
  );
}