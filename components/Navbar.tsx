"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_LOGO = "/logos/navbar-logo.png";
const ADMIN_EMAILS = ["onovaejoy4@gmail.com", "sharpsharptaxi@gmail.com"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    role === "admin" ||
    ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");

  /* ===== SCROLL EFFECT ===== */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ===== CLICK OUTSIDE ===== */
  useEffect(() => {
    function handleClickOutside(e: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ===== AUTH ===== */
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();

        setRole(data?.role ?? null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav
      className={`sticky top-0 z-[100] transition-all duration-300 ${
        scrolled
          ? "bg-[#08141b]/95 backdrop-blur-xl shadow-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center">
          <Image
            src={NAV_LOGO}
            alt="logo"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden items-center gap-6 md:flex">
          <NavItem href="/" pathname={pathname}>
            Home
          </NavItem>
          <NavItem href="/rides" pathname={pathname}>
            Book Ride
          </NavItem>
          <NavItem href="/offer-a-ride" pathname={pathname}>
            Offer Ride
          </NavItem>
          <NavItem href="/rent" pathname={pathname}>
            Rent
          </NavItem>
          <NavItem href="/delivery" pathname={pathname}>
            Delivery
          </NavItem>
          <NavItem href="/faq" pathname={pathname}>
            FAQ
          </NavItem>

          {isAdmin && (
            <NavItem href="/admin/driver-applications" pathname={pathname}>
              Admin
            </NavItem>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {user ? (
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                onClick={() => setAccountOpen((p) => !p)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-white/10"
              >
                Account
              </button>

              {/* DROPDOWN */}
              <div
                className={`absolute right-0 top-[120%] w-64 origin-top transform rounded-2xl border border-white/10 bg-[#0b1d26]/95 backdrop-blur-xl shadow-2xl transition-all duration-200 ${
                  accountOpen
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <div className="p-2">
                  <Drop href="/dashboard">Dashboard</Drop>
                  <Drop href="/dashboard/bookings">My Bookings</Drop>

                  {isAdmin && (
                    <Drop href="/admin/driver-applications">Admin</Drop>
                  )}

                  <div className="my-2 h-px bg-white/10" />

                  <button
                    onClick={logout}
                    className="w-full rounded-xl px-4 py-2 text-left text-red-400 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-5 py-2 text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* MOBILE */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-2xl"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#08141b] px-4 py-4">
          <div className="flex flex-col gap-3">
            <Mobile href="/">Home</Mobile>
            <Mobile href="/rides">Book Ride</Mobile>
            <Mobile href="/offer-a-ride">Offer Ride</Mobile>
            <Mobile href="/rent">Rent</Mobile>
            <Mobile href="/delivery">Delivery</Mobile>
            <Mobile href="/faq">FAQ</Mobile>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ===== COMPONENTS ===== */

function NavItem({
  href,
  children,
  pathname,
}: any) {
  const active = pathname === href;

  return (
    <Link
      href={href}
      className="relative text-sm font-medium text-white/80 hover:text-white"
    >
      {children}
      <span
        className={`absolute left-0 -bottom-1 h-[2px] bg-emerald-400 transition-all ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

function Drop({ href, children }: any) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-4 py-2 text-sm hover:bg-white/5 hover:text-emerald-400"
    >
      {children}
    </Link>
  );
}

function Mobile({ href, children }: any) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 px-4 py-3 text-white"
    >
      {children}
    </Link>
  );
}