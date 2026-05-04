"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <nav className="sticky left-0 right-0 top-0 z-[100] overflow-visible border-b border-white/10 bg-[#08141b]/95 shadow-lg backdrop-blur transition-all duration-300">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between overflow-visible px-4 py-3 sm:px-5 lg:px-8">
        <Link
          href="/"
          onClick={closeMenus}
          className="flex shrink-0 items-center"
        >
          <Image
            src={NAV_LOGO}
            alt="SharpSharp Ride logo"
            width={150}
            height={45}
            className={`w-auto object-contain transition-all duration-300 ${
              scrolled ? "h-8 sm:h-9" : "h-9 sm:h-10 lg:h-11"
            }`}
            priority
          />
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          <NavLink href="/" pathname={pathname}>
            Home
          </NavLink>

          <NavLink href="/rides" pathname={pathname}>
            Book Ride
          </NavLink>

          <NavLink href="/offer-a-ride" pathname={pathname}>
            Offer Ride
          </NavLink>

          <NavLink href="/rent" pathname={pathname}>
            Rent
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

        <div className="flex items-center gap-3 overflow-visible">
          {!loading && user ? (
            <div
              ref={dropdownRef}
              className="relative hidden overflow-visible md:block"
            >
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Account
              </button>

              <div
                className={`absolute right-2 top-[120%] z-[200] w-[240px] min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1d26]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 ${
                  accountOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                }`}
              >
                <div className="space-y-1 p-2">
                  <DropdownLink href="/dashboard" onClick={closeMenus}>
                    Dashboard
                  </DropdownLink>

                  <DropdownLink
                    href="/dashboard/bookings"
                    onClick={closeMenus}
                  >
                    My Bookings
                  </DropdownLink>

                  {isAdmin && (
                    <DropdownLink
                      href="/admin/driver-applications"
                      onClick={closeMenus}
                    >
                      Admin
                    </DropdownLink>
                  )}

                  <div className="my-1 h-px bg-white/10" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    Logout
                  </button>
                </div>
              </div>
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
                Book Ride
              </MobileLink>

              <MobileLink
                href="/offer-a-ride"
                pathname={pathname}
                onClick={closeMenus}
              >
                Offer Ride
              </MobileLink>

              <MobileLink href="/rent" pathname={pathname} onClick={closeMenus}>
                Rent
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

function DropdownLink({
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
      className="flex w-full items-center justify-start whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 hover:text-emerald-400"
    >
      {children}
    </Link>
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
      className="group relative text-sm font-semibold text-white/75 transition hover:text-white"
    >
      {children}

      <span
        className={`absolute -bottom-2 left-0 h-[2px] rounded-full bg-emerald-400 transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
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