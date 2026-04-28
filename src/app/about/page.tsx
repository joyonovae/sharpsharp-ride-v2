import Link from "next/link";

const values = [
  {
    title: "Safety First",
    desc: "We are building SharpSharp Ride around verified drivers, clear booking records, and secure payment flows.",
  },
  {
    title: "Affordable Movement",
    desc: "Shared rides make intercity travel easier by helping riders split travel costs and find available seats faster.",
  },
  {
    title: "Built for Nigeria",
    desc: "SharpSharp Ride is designed around how people actually move, book, travel, send packages, and rent cars in Nigeria.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-[#061116] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 py-20 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
              About SharpSharp Ride
            </p>

            <h1 className="mt-4 text-5xl font-black leading-tight sm:text-6xl">
              Moving Nigeria,
              <br />
              One Ride at a Time.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              SharpSharp Ride is a mobility platform created to make ride
              booking, car rentals, and package delivery easier, safer, and more
              accessible across Nigeria.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/rides"
                className="rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
              >
                Book a Ride
              </Link>

              <Link
                href="/contact"
                className="rounded-full border border-white/15 px-7 py-4 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 sm:h-[460px]">
            <img
              src="/about/about-hero.jpg"
              alt="SharpSharp Ride"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#061116]/45" />

            <div className="absolute bottom-6 left-6 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm font-bold text-white">
                🚗 Smart rides. Secure bookings.
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Built for everyday movement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white px-5 py-16 text-[#061116] lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-600">
            Our Story
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            Why We Built SharpSharp Ride
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Transportation should not be stressful, confusing, or expensive.
            SharpSharp Ride was created to give riders a simpler way to find
            available trips, help drivers earn from empty seats, and make
            everyday movement more organized.
          </p>

          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            We are starting with shared rides and expanding into rentals and
            delivery, with one goal: helping people move smarter.
          </p>
        </div>
      </section>

      {/* VALUES */}
      <section className="px-5 py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
              What We Stand For
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Our Core Values
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-2 hover:border-emerald-400/50"
              >
                <h3 className="text-2xl font-black text-emerald-400">
                  {value.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-300">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-white px-5 py-16 text-[#061116] lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-slate-50 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600">
              Our Mission
            </p>
            <h2 className="mt-4 text-3xl font-black">
              To make movement simpler, safer, and more affordable.
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              We want users to easily book rides, manage bookings, make secure
              payments, and travel with better confidence.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[#061116] p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Our Vision
            </p>
            <h2 className="mt-4 text-3xl font-black">
              A trusted mobility network across Nigerian cities.
            </h2>
            <p className="mt-4 leading-8 text-slate-300">
              We are building toward a future where people can find rides,
              rentals, and delivery options from one reliable platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#0b1d33] p-8 text-center md:p-12">
          <h2 className="text-4xl font-black">
            Ready to move SharpSharp?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-300">
            Find available rides, manage your bookings, or apply to become a
            verified driver on SharpSharp Ride.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/rides"
              className="rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
            >
              Book a Ride
            </Link>

            <Link
              href="/apply/driver"
              className="rounded-full border border-white/15 px-7 py-4 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Become a Driver
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}