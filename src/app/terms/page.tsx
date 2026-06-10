import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | SharpSharp Ride",
  description: "Terms governing use of SharpSharp Ride services.",
};

const sections = [
  {
    title: "1. Accepting These Terms",
    content: [
      "These Terms of Service govern your access to and use of SharpSharp Ride, including ride listings, ride requests, bookings, rentals, driver applications, reviews, notifications, and related services.",
      "By creating an account, signing in through Google OAuth or another supported method, or using the platform, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.",
      "You must be legally capable of entering into this agreement and must provide accurate, current information.",
    ],
  },
  {
    title: "2. Accounts and Authentication",
    content: [
      "You are responsible for activity performed through your account and for maintaining the security of your sign-in methods. You must promptly notify us if you suspect unauthorized access.",
      "You must not impersonate another person, create misleading accounts, misuse Google OAuth, or provide false identity, contact, driver, or vehicle information.",
    ],
  },
  {
    title: "3. Platform Role",
    content: [
      "SharpSharp Ride provides technology that helps users discover and arrange rides, rentals, and related services. Drivers and rental owners remain responsible for the services, vehicles, representations, and conduct they provide.",
      "Availability, schedules, routes, prices, vehicles, and service completion may depend on drivers, rental owners, passengers, traffic, weather, safety conditions, and other circumstances outside our direct control.",
    ],
  },
  {
    title: "4. Driver Applications and Responsibilities",
    content: [
      "Driver access requires approval. Applicants must submit accurate information and required verification materials, which may include a passport photograph, driver's licence information, vehicle details, plate number, and vehicle photographs.",
      "Approval does not guarantee continued access. Drivers must maintain legally required licences, permissions, insurance, roadworthy vehicles, and safe conduct. Drivers must not create misleading rides or carry more passengers than permitted.",
      "SharpSharp Ride may reject an application, revoke driver approval, or restrict driver access where information is inaccurate, requirements are not met, or safety and platform rules are breached. Historical records may be retained.",
    ],
  },
  {
    title: "5. Ride Bookings and User Responsibilities",
    content: [
      "Passengers must provide accurate booking information, arrive at agreed locations on time, behave safely and respectfully, and follow reasonable trip instructions.",
      "A ride request is not a confirmed booking unless the platform clearly shows assignment and required payment or confirmation has been completed. Users must verify ride details before travel.",
      "Drivers and passengers must not use the platform for unlawful activity, harassment, discrimination, dangerous conduct, unauthorized commercial activity, or transporting prohibited items.",
    ],
  },
  {
    title: "6. Rentals and Rental Listings",
    content: [
      "Rental vehicle submissions require review before publication. Rental owners must have authority to list the vehicle and must provide accurate condition, ownership, availability, pricing, and vehicle information.",
      "Renters must use vehicles lawfully, provide accurate information, comply with agreed pickup and return arrangements, and remain responsible for misuse, damage, penalties, or other obligations established for the rental.",
      "Published availability does not guarantee that a vehicle remains available until a booking and payment are confirmed.",
    ],
  },
  {
    title: "7. Payments, Cancellations, and Refunds",
    content: [
      "Payments are processed through Paystack. You authorize the processing of charges for bookings or rentals you select. Payment confirmation depends on successful verification of the transaction.",
      "Displayed prices, charges, and booking details should be reviewed before payment. You must not manipulate payment references, amounts, booking metadata, or payment confirmation systems.",
      "Cancellation and refund eligibility may depend on the service, timing, circumstances, and applicable policy communicated by SharpSharp Ride or support. Processing fees or completed services may be non-refundable where permitted by law.",
    ],
  },
  {
    title: "8. Notifications and Communications",
    content: [
      "You agree that SharpSharp Ride may send transactional emails and in-platform notifications concerning authentication, applications, bookings, payments, assignments, reviews, safety, support, and account status.",
      "You are responsible for keeping your email address and contact information current and reviewing important account communications.",
    ],
  },
  {
    title: "9. Reviews and User Content",
    content: [
      "Reviews must reflect genuine completed-trip experiences and must not contain threats, harassment, unlawful content, private information, spam, or knowingly false claims.",
      "You retain responsibility for content you submit and grant SharpSharp Ride permission to store, display, moderate, and use it as needed to operate and improve the platform.",
    ],
  },
  {
    title: "10. Suspension, Blocking, and Review",
    content: [
      "SharpSharp Ride may suspend, block, limit, or terminate access to protect users, investigate concerns, comply with law, address payment or fraud risks, or enforce these Terms.",
      "Suspended or blocked users may submit a suspension review request through the available account process. Submitting a request does not guarantee reinstatement. We may retain booking, payment, safety, and enforcement records after restriction.",
      "Administrative controls must not be abused, and users must not attempt to bypass a restriction through another account.",
    ],
  },
  {
    title: "11. Safety, Disclaimers, and Liability",
    content: [
      "Users must exercise independent judgment and take reasonable safety precautions. In an emergency, contact the appropriate emergency services.",
      "The platform is provided on an as-available basis. To the extent permitted by law, SharpSharp Ride does not guarantee uninterrupted access, specific service availability, or the conduct of every user.",
      "To the extent permitted by applicable law, SharpSharp Ride is not liable for indirect, incidental, special, or consequential losses arising from use of the platform. Nothing in these Terms excludes liability that cannot legally be excluded.",
    ],
  },
  {
    title: "12. Changes, Governing Rules, and Contact",
    content: [
      "We may update these Terms as the platform evolves. Continued use after an update means you accept the revised Terms, subject to applicable law.",
      "These Terms are governed by applicable laws of the Federal Republic of Nigeria. Disputes should first be raised with SharpSharp Ride support so the parties can attempt a practical resolution.",
      "Questions about these Terms may be sent to support@sharpsharpride.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#061116] px-5 py-14 text-white lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
            SharpSharp Ride Legal
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">Terms of Service</h1>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            These terms describe the rules and responsibilities that apply when
            using SharpSharp Ride services.
          </p>
          <p className="mt-4 text-sm text-white/60">Effective date: June 10, 2026</p>
        </header>

        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6 md:p-8"
            >
              <h2 className="text-2xl font-black text-emerald-400">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.content.map((paragraph) => (
                  <p key={paragraph} className="leading-8 text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 text-center md:p-8">
          <p className="leading-7 text-slate-200">
            Our Privacy Policy explains how information is handled while you use
            SharpSharp Ride.
          </p>
          <Link
            href="/privacy"
            className="mt-5 inline-flex rounded-full bg-emerald-500 px-7 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
