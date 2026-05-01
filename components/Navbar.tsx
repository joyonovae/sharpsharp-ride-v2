"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  role: string | null;
};

const NAV_LOGO = "/logos/navbar-logo.png";
const ADMIN_EMAILS = ["onovaejoy4@gmail.com", "sharpsharptaxi@gmail.com"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

        if (mounted) setUserRole(profile?.role ?? null);
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-5 lg:px-8">
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
    ? "h-10 drop-shadow-[0_0_6px_rgba(24,195,126,0.2)]"
    : "h-12 drop-shadow-[0_0_8px_rgba(24,195,126,0.25)] sm:h-14 lg:h-16"
}`}
              priority
            />
          </div>
        </Link>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <NavLink href="/" pathname={pathname}>
            Home
          </NavLink>

          <NavLink href="/rides" pathname={pathname}>
            Book a Ride
          </NavLink>

          <NavLink href="/offer-a-ride" pathname={pathname}>
            Offer a Ride
          </NavLink>

          <NavLink href="/rent" pathname={pathname}>
            Rent a Car
          </NavLink>

          <NavLink href="/delivery" pathname={pathname}>
            Delivery
          </NavLink>

          <NavLink href="/faq" pathname={pathname}>
            FAQ
          </NavLink>

          {isAdmin && (
            <NavLink href="/admin/driver-applications" pathname={pathname}>
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
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Account
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#0d1c24] p-3 shadow-2xl">
                  <Link
                    href="/dashboard"
                    onClick={closeMenus}
                    className="block whitespace-nowrap rounded-xl px-3 py-2 text-white transition hover:bg-white/5 hover:text-emerald-400"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/bookings"
                    onClick={closeMenus}
                    className="block rounded-xl px-3 py-2 text-white transition hover:bg-white/5 hover:text-emerald-400"
                  >
                    My Bookings
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/driver-applications"
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-2 text-white transition hover:bg-white/5 hover:text-red-400"
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-xl px-3 py-2 text-left font-bold text-red-400 transition hover:bg-red-500/10"
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
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-[#18c37e] px-5 py-2 text-sm font-semibold text-[#04130c] transition hover:bg-emerald-400"
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
        <div className="border-t border-white/10 bg-[#08141b] px-4 py-5 shadow-2xl md:hidden">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-col gap-2 text-base font-semibold">
              <MobileLink href="/" pathname={pathname} onClick={closeMenus}>
                Home
              </MobileLink>

              <MobileLink href="/rides" pathname={pathname} onClick={closeMenus}>
                Book a Ride
              </MobileLink>

              <MobileLink
                href="/offer-a-ride"
                pathname={pathname}
                onClick={closeMenus}
              >
                Offer a Ride
              </MobileLink>

              <MobileLink href="/rent" pathname={pathname} onClick={closeMenus}>
                Rent a Car
              </MobileLink>

              <MobileLink
                href="/delivery"
                pathname={pathname}
                onClick={closeMenus}
              >
                Delivery
              </MobileLink>

              <MobileLink href="/faq" pathname={pathname} onClick={closeMenus}>
                FAQ
              </MobileLink>

              {isAdmin && (
                <MobileLink
                  href="/admin/driver-applications"
                  pathname={pathname}
                  onClick={closeMenus}
                >
                  Admin
                </MobileLink>
              )}

              <div className="mt-3 border-t border-white/10 pt-4">
                {!loading && user ? (
                  <div className="flex flex-col gap-2">
                    <MobileLink
                      href="/dashboard"
                      pathname={pathname}
                      onClick={closeMenus}
                    >
                      Dashboard
                    </MobileLink>

                    <MobileLink
                      href="/dashboard/bookings"
                      pathname={pathname}
                      onClick={closeMenus}
                    >
                      My Bookings
                    </MobileLink>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl bg-red-500/15 px-5 py-3 text-left font-bold text-red-300"
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
        </div>
      )}
    </nav>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  children,
  pathname,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 transition ${
        active
          ? "bg-emerald-500/15 font-bold text-emerald-400 ring-1 ring-emerald-400/30"
          : "text-white/80 hover:bg-white/5 hover:text-emerald-400"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  pathname,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string;
  onClick: () => void;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 transition ${
        active
          ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
          : "border border-white/10 bg-white/5 text-white hover:border-emerald-400/40 hover:text-emerald-400"
      }`}
    >
      {children}
    </Link>
  );
}