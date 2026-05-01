import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const FOOTER_LOGO = "/logos/footer-logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#061a2f] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        
        {/* LOGO + DESCRIPTION */}
        <div>
          <Link href="/" className="inline-flex items-center">
            <Image
              src={FOOTER_LOGO}
              alt="SharpSharp Ride footer logo"
              width={240}
              height={100}
              className="h-14 w-auto object-contain drop-shadow-[0_0_8px_rgba(24,195,126,0.25)] transition-all duration-300 hover:scale-105 sm:h-16 lg:h-18"
              priority
            />
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            SharpSharp Ride helps people move smarter with ride booking, car rentals,
            and package delivery in one clean experience.
          </p>
        </div>

        {/* SERVICES */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">
            Services
          </h3>
          <div className="mt-5 space-y-3 text-sm text-white/70">
            <Link href="/rides" className="block transition hover:text-white">Book a Ride</Link>
            <Link href="/rent" className="block transition hover:text-white">Rent a Car</Link>
            <Link href="/delivery" className="block transition hover:text-white">Send Package</Link>
            <Link href="/checkout" className="block transition hover:text-white">Checkout</Link>
          </div>
        </div>

        {/* COMPANY */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">
            Company
          </h3>
          <div className="mt-5 space-y-3 text-sm text-white/70">
            <Link href="/offer-a-ride" className="block transition hover:text-white">Become a Driver</Link>
            <Link href="/#how-it-works" className="block transition hover:text-white">How it Works</Link>
            <Link href="/login" className="block transition hover:text-white">Login</Link>
            <Link href="/signup" className="block transition hover:text-white">Get Started</Link>
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">
            Contact
          </h3>
          <div className="mt-5 space-y-4 text-sm text-white/70">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#18c37e]" />
              <span>Abuja, Nigeria</span>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-[#18c37e]" />
              <span>support@sharpsharpride.com</span>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-[#18c37e]" />
              <span>+234 806 684 3760</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-sm text-white/60 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 SharpSharp Ride. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/" className="transition hover:text-white">Privacy</Link>
            <Link href="/" className="transition hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}