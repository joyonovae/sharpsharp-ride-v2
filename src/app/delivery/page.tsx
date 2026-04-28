import Link from "next/link";
import { Package, MapPin, ShieldCheck, Clock, Mail } from "lucide-react";

export default function DeliveryPage() {
  return (
    <main className="bg-[#061116] text-white">
      <section className="px-5 py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
                SharpSharp Delivery
              </p>

              <h1 className="mt-4 text-5xl font-black leading-tight sm:text-6xl">
                Send Packages Across Cities.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Our delivery service is being prepared to help users send
                packages safely and conveniently across supported locations.
              </p>

              <p className="mt-4 max-w-xl leading-7 text-slate-400">
                For now, please contact us directly for delivery enquiries,
                partnerships, or special requests.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
                >
                  Contact Us
                </Link>

                <Link
                  href="/rides"
                  className="rounded-full border border-white/15 px-7 py-4 font-bold transition hover:border-emerald-400 hover:text-emerald-400"
                >
                  Book a Ride
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-[#04130c]">
                <Package className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-2xl font-black">
                Delivery Coming Soon
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                We’re working on a smooth delivery request flow with package
                details, pickup address, receiver details, and delivery updates.
              </p>

              <div className="mt-6 grid gap-4">
                <Feature
                  icon={<MapPin className="h-5 w-5" />}
                  title="City-to-city delivery"
                  desc="Send packages between supported Nigerian cities."
                />

                <Feature
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Safer handling"
                  desc="Designed for clear package records and support."
                />

                <Feature
                  icon={<Clock className="h-5 w-5" />}
                  title="Delivery updates"
                  desc="Tracking and status updates can be added after launch."
                />

                <Feature
                  icon={<Mail className="h-5 w-5" />}
                  title="Direct enquiries"
                  desc="Use the contact page for delivery-related requests."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[#04130c]">
        {icon}
      </div>

      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{desc}</p>
      </div>
    </div>
  );
}