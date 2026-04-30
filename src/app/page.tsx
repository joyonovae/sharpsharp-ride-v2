"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";

const services = [
  {
    title: "Shared Rides",
    desc: "Affordable intercity carpooling. Share a ride, split the cost, travel safe.",
    tag: "Ride",
    href: "/rides",
  },
  {
    title: "Car Rental",
    desc: "Rent available cars for short trips, events, and personal movement.",
    tag: "Rent",
    href: "/rent",
  },
  {
    title: "Delivery",
    desc: "Send parcels across cities quickly and easily.",
    tag: "Send",
    href: "/delivery",
  },
];

const routes = [
  ["Lagos", "Abuja", "₦15,000"],
  ["Lagos", "Ibadan", "₦3,500"],
  ["Abuja", "Jos", "₦5,000"],
  ["Lagos", "Benin City", "₦6,000"],
  ["Abuja", "Kaduna", "₦3,000"],
  ["Port Harcourt", "Calabar", "₦4,000"],
  ["Lagos", "Enugu", "₦10,000"],
  ["Abuja", "Kano", "₦7,000"],
];

const slides = [
  "/hero/ride1.jpg",
  "/hero/ride2.jpg",
  "/hero/ride3.jpg",
];

export default function HomePage() {
  const router = useRouter();

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    const elements = document.querySelectorAll(".scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");

            const children = entry.target.querySelectorAll(".stagger");
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * 120}ms`;
              child.classList.add("show");
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  function handleHeroSearch() {
    const params = new URLSearchParams();

    if (fromCity.trim()) params.set("from", fromCity.trim());
    if (toCity.trim()) params.set("to", toCity.trim());
    if (travelDate) params.set("date", travelDate);

    const queryString = params.toString();
    router.push(queryString ? `/rides?${queryString}` : "/rides");
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-[#061116] text-white">
      <style jsx global>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(40px) scale(0.98);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .scroll-reveal.show {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .stagger {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .stagger.show {
          opacity: 1;
          transform: translateY(0);
        }

        .typing-text {
          width: fit-content;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #10b981;
          animation: typing 3.5s steps(38, end) forwards,
            blink 0.8s step-end infinite;
        }

        @keyframes typing {
          from {
            max-width: 0;
          }
          to {
            max-width: 100%;
          }
        }

        @keyframes blink {
          50% {
            border-color: transparent;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="relative w-full max-w-full overflow-x-hidden bg-white text-[#061116]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7fff9_0%,#ecfff6_48%,#dff6ff_100%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-24 pt-32 sm:px-5 sm:pt-36 lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:pb-24 lg:pt-32">
          <div className="scroll-reveal z-10">
            <p className="typing-text mb-4 h-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-sm">
              Ride safely anywhere in Nigeria...
            </p>

           <h1 className="max-w-3xl text-[2.75rem] font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Find Your Next
              <br />
              SharpSharp Ride
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
              Book shared rides, rent available cars, and send packages across
              Nigeria from one simple platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rides"
                className="rounded-full bg-[#061116] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-emerald-600"
              >
                Shared Rides
              </Link>

              <Link
                href="/rent"
                className="rounded-full bg-[#061116] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-emerald-600"
              >
                Car Rentals
              </Link>

              
            </div>
          </div>

          <div className="relative z-10 block h-[300px] w-full max-w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/20 sm:h-[360px] lg:h-full lg:rounded-bl-[5rem] lg:rounded-tl-none lg:rounded-tr-none">
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              speed={1200}
              loop
              className="h-full w-full"
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide}>
                  <div className="h-full w-full overflow-hidden">
                    <div
                      className="h-full w-full scale-105 bg-cover bg-center transition-transform duration-[6000ms] ease-linear hover:scale-110"
                      style={{ backgroundImage: `url('${slide}')` }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="absolute inset-0 bg-gradient-to-t from-[#061116]/70 via-[#061116]/30 to-transparent" />

            <div className="pointer-events-none absolute -top-6 right-10 z-20 h-28 w-28 rotate-45 rounded-[2rem] bg-lime-300/35 blur-[1px]" />

            <div className="absolute bottom-5 left-4 right-4 z-30 rounded-3xl bg-white px-4 py-4 shadow-2xl sm:left-auto sm:right-8 sm:w-auto sm:px-6">
              <p className="font-bold text-slate-900">🚗 Lagos → Abuja</p>
              <p className="mt-1 text-sm text-slate-500">
                Seats available today
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-12 w-full max-w-6xl px-4 pb-16 sm:px-5 lg:-mt-20 lg:px-12">
          <div className="scroll-reveal rounded-[2rem] bg-white/95 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl md:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  From
                </p>
                <input
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="e.g. Abuja"
                  className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  To
                </p>
                <input
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="e.g. Lagos"
                  className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Date
                </p>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleHeroSearch}
                className="flex h-16 items-center justify-center rounded-2xl bg-emerald-500 px-10 text-lg font-black text-[#04130c] transition hover:scale-[1.02] hover:bg-emerald-400"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
<section className="bg-[#061116] px-5 py-16 text-white sm:py-20 lg:px-12">
  <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">


    {/* IMAGE SIDE */}
    <div className="scroll-reveal relative h-[350px] overflow-hidden rounded-[2rem] sm:h-[420px]">
      <img
        src="/about/about-hero.jpg"
        alt="About SharpSharp Ride"
        className="h-full w-full object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-[#061116]/50" />

      {/* FLOATING CARD */}
      <div className="absolute bottom-6 left-6 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
        <p className="text-sm font-bold text-white">🚀 Fast Growing Platform</p>
        <p className="text-xs text-slate-300">Trusted by riders across Nigeria</p>
      </div>
    </div>
    {/* TEXT SIDE */}
    <div className="scroll-reveal">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
        About SharpSharp Ride
      </p>

      <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
        Built for How Nigerians Move
      </h2>

      <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
        SharpSharp Ride is a modern mobility platform designed to make
        transportation across Nigeria faster, safer, and more affordable.
        Whether you're booking a shared ride, renting a car, or sending a
        package — everything is simplified in one place.
      </p>

      <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
        We’re building a trusted network of drivers, riders, and businesses —
        powered by technology and driven by reliability.
      </p>

      {/* CTA BUTTONS */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/about"
          className="rounded-full bg-emerald-500 px-7 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400"
        >
          Learn More
        </Link>

        <Link
          href="/contact"
          className="rounded-full border border-white/15 px-7 py-3 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
        >
          Contact Us
        </Link>
      </div>
    </div>

  </div>
</section>

      {/* SERVICES */}
      <section className="bg-white px-5 py-14 text-[#061116] sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Our Services</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Everything you need to move around Nigeria — rides, cars, and
              delivery — all in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="scroll-reveal rounded-3xl border p-6 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                  {service.tag}
                </span>
                <h3 className="mt-5 text-2xl font-black">{service.title}</h3>
                <p className="mt-3 text-slate-600">{service.desc}</p>
                <Link
                  href={service.href}
                  className="mt-5 inline-block font-bold text-emerald-600"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
<section className="relative overflow-hidden bg-[#061116] px-5 py-20 text-white sm:py-24 lg:bg-fixed lg:bg-[url('/hero/how-it-works-bg.jpg')] lg:bg-cover lg:bg-center lg:px-12">
  <div className="absolute inset-0 bg-[#061116]/85 lg:bg-[#061116]/78" />

  <div className="relative mx-auto max-w-7xl text-center">
    <div className="scroll-reveal">
      <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
        Simple Process
      </p>

      <h2 className="mt-3 text-4xl font-black sm:text-5xl">
        How SharpSharp Ride Works
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
        Whether you’re booking a seat, renting a car, or sending a package,
        SharpSharp Ride keeps the process simple, secure, and fast.
      </p>
    </div>

    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "Search Your Route",
          desc: "Enter your pickup city, destination, and travel date to see available rides and transport options.",
        },
        {
          title: "Choose & Book",
          desc: "Compare available seats, prices, pickup points, and trip details before confirming your booking.",
        },
        {
          title: "Pay Securely",
          desc: "Complete your payment safely through Paystack. Your booking is only confirmed after payment is verified.",
        },
        {
          title: "Move With Ease",
          desc: "Get your booking record, seat confirmation, and trip details from your dashboard whenever you need them.",
        },
      ].map((step, index) => (
        <div
          key={step.title}
          className="scroll-reveal rounded-[1.7rem] border border-white/10 bg-white/10 p-6 text-left backdrop-blur-md transition hover:-translate-y-2 hover:border-emerald-400/50 hover:bg-white/15"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-[#04130c]">
            {index + 1}
          </div>

          <h3 className="mt-6 text-xl font-black">{step.title}</h3>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {step.desc}
          </p>
        </div>
      ))}
    </div>

    <div className="scroll-reveal mx-auto mt-12 max-w-3xl rounded-[1.7rem] border border-emerald-400/20 bg-emerald-500/10 p-6 backdrop-blur">
      <p className="text-base font-medium leading-7 text-emerald-100">
    Fast bookings. Verified drivers. Secure payments.
    <br />
    Everything you need to move around Nigeria — all in one place.
  </p>
    </div>
  </div>
</section>

      {/* ROUTES */}
      <section className="bg-white px-5 py-14 text-[#061116] sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Popular Routes</h2>
            <p className="mt-3 text-slate-600">
              Most booked intercity routes by our riders.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {routes.map(([from, to, price]) => (
              <div
                key={`${from}-${to}`}
                className="scroll-reveal rounded-2xl border p-5 transition hover:-translate-y-2 hover:border-emerald-400 hover:shadow-lg"
              >
                <h3 className="font-black">
                  {from} → {to}
                </h3>
                <p className="mt-2 font-bold text-emerald-600">From {price}</p>
                <p className="text-sm text-slate-500">per seat</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="px-5 py-14 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="scroll-reveal">
            <h2 className="text-3xl font-black sm:text-4xl">
              Your Safety Comes First
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              We take safety seriously. From verified drivers to secure payments,
              your journey is protected.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Verified Drivers",
              "Secure Payments",
              "Emergency Contact",
              "Rated & Reviewed",
            ].map((item) => (
              <div
                key={item}
                className="scroll-reveal rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-2 hover:border-emerald-500/40"
              >
                <h3 className="text-xl font-bold text-emerald-400">{item}</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Built to make every trip safer and more reliable.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section className="px-5 py-14 sm:py-20 lg:px-12">
        <div className="scroll-reveal mx-auto max-w-7xl rounded-[2rem] bg-[#0b1d33] p-7 md:p-12">
          <h2 className="text-3xl font-black sm:text-4xl">
            Earn Money With SharpSharp Ride
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Join our growing network of drivers and delivery riders. Flexible
            hours, fair earnings, and a supportive community.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/offer-a-ride"
              className="rounded-full bg-emerald-500 px-7 py-4 text-center font-bold text-[#04130c] transition hover:bg-emerald-400"
            >
              Become a Driver
            </Link>

            <Link
              href="/rent"
              className="rounded-full border border-white/15 px-7 py-4 text-center font-bold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Browse Rental Cars
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}