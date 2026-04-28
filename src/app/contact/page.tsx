import Link from "next/link";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";

export default function ContactPage() {
  return (
    <main className="bg-[#061116] text-white">
      <section className="px-5 py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
            Contact Us
          </p>

          <div className="mt-4 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            {/* LEFT SIDE */}
            <div>
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">
                Let’s Help You Move SharpSharp.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Have questions about bookings, driver applications, rentals, or
                delivery? Reach out and we’ll help you get the right support.
              </p>

              <div className="mt-10 space-y-4">
                <ContactItem
                  icon={<MapPin className="h-5 w-5" />}
                  title="Location"
                  value="Abuja, Nigeria"
                />

                <ContactItem
                  icon={<Mail className="h-5 w-5" />}
                  title="Email"
                  value="hello@sharpsharpride.com"
                />

                <ContactItem
                  icon={<Phone className="h-5 w-5" />}
                  title="Phone"
                  value="+234 000 000 0000"
                />

                <ContactItem
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Support"
                  value="Available for ride and driver application enquiries"
                />
              </div>
            </div>

            {/* RIGHT SIDE (FORM) */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-black">Send a Message</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Fill the form below and we’ll get back to you shortly.
              </p>

              <ContactForm />
            </div>
          </div>

          {/* SUPPORT CARDS */}
          <div className="mt-16 rounded-[2rem] bg-white p-8 text-[#061116]">
            <div className="grid gap-8 md:grid-cols-3">
              <SupportCard
                title="Ride Bookings"
                desc="Get help with booking records, payments, ride details, and seat confirmation."
              />
              <SupportCard
                title="Driver Applications"
                desc="Questions about applying, approval status, vehicle details, or offering rides."
              />
              <SupportCard
                title="Partnerships"
                desc="For rentals, delivery, corporate movement, and future business enquiries."
              />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-black">
                Need to book a ride now?
              </h2>
              <p className="mt-2 text-slate-300">
                Browse available shared rides and reserve your seat.
              </p>
            </div>

            <Link
              href="/rides"
              className="rounded-full bg-emerald-500 px-7 py-4 font-bold text-[#04130c] transition hover:bg-emerald-400"
            >
              Find a Ride
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* COMPONENTS */

function ContactItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-[#04130c]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="mt-1 font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function SupportCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{desc}</p>
    </div>
  );
}