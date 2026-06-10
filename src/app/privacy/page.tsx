import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | SharpSharp Ride",
  description: "How SharpSharp Ride collects, uses, protects, and shares personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information you provide when you create or complete an account, including your name, email address, phone number, profile details, and authentication information.",
      "When you use Google OAuth, Google provides account information such as your name, email address, profile image, and a unique account identifier. SharpSharp Ride does not receive your Google password.",
      "Driver applications may include identity and verification information such as a passport photograph, driver's licence information, address, vehicle details, plate number, vehicle photographs, and application notes.",
      "Ride and rental activity may include routes, travel dates, pickup and return locations, booking details, passenger information, rental listings, reviews, account-status records, support messages, and suspension review requests.",
    ],
  },
  {
    title: "2. Payments",
    content: [
      "Payments are processed through Paystack. SharpSharp Ride receives transaction references, payment status, amount, and related booking metadata needed to confirm and manage a booking.",
      "SharpSharp Ride does not store full payment card details. Paystack processes payment information under its own terms and privacy practices.",
    ],
  },
  {
    title: "3. How We Use Information",
    content: [
      "We use personal information to authenticate users, operate accounts, process bookings and rentals, verify drivers and vehicles, facilitate communication, confirm payments, provide support, prevent fraud, enforce platform rules, and improve the service.",
      "We may use your contact details to send transactional emails and notifications about applications, bookings, payments, assignments, account status, reviews, and important service updates.",
    ],
  },
  {
    title: "4. Driver and Rental Information",
    content: [
      "Passport photographs and other sensitive driver verification documents are used for private administrative review and are not intended for public display.",
      "Approved driver profiles and listings may display limited information needed to build trust and complete a service, such as a driver's name, verified status, rating, vehicle type, brand, model, color, and appropriately limited plate information.",
      "Rental vehicle submissions remain subject to review. Unapproved submissions are not published as available rental inventory.",
    ],
  },
  {
    title: "5. How We Share Information",
    content: [
      "We share information only as reasonably necessary to operate the platform. For example, relevant booking details may be shared between a passenger and driver, or between a renter and approved rental owner.",
      "We use service providers such as Supabase for authentication, database, and storage services; Paystack for payments; Resend for transactional emails; Google for OAuth authentication; and hosting or infrastructure providers used to operate SharpSharp Ride.",
      "We may disclose information where required by law, to respond to lawful requests, protect users, investigate fraud or safety incidents, or enforce our agreements.",
      "We do not sell personal information.",
    ],
  },
  {
    title: "6. Account Suspension and Reviews",
    content: [
      "We maintain account status, suspension reasons, administrative notes, and suspension review requests where needed to protect users and operate the platform safely.",
      "Suspended or blocked users may request a review. Review submissions and supporting information are used to evaluate whether access should be restored.",
    ],
  },
  {
    title: "7. Data Retention and Security",
    content: [
      "We retain information for as long as reasonably necessary to provide the service, maintain booking and payment records, resolve disputes, prevent abuse, and comply with legal obligations.",
      "We use reasonable technical and organizational safeguards, including access controls and private storage for sensitive verification photographs. No internet service can guarantee absolute security.",
    ],
  },
  {
    title: "8. Your Choices and Rights",
    content: [
      "You may update available profile information through your account or contact us to request access, correction, deletion, restriction, or other action concerning your personal information, subject to applicable law and legitimate record-retention requirements.",
      "You may stop receiving non-essential communications where an unsubscribe option is available. Transactional and safety messages may still be sent while you use the service.",
      "You may disconnect Google access through your Google account settings. Disconnecting access does not automatically delete records SharpSharp Ride must retain.",
    ],
  },
  {
    title: "9. Children, Changes, and Contact",
    content: [
      "SharpSharp Ride is not intended for children who cannot legally enter into these terms or use the relevant services without appropriate consent.",
      "We may update this Privacy Policy as the platform or applicable requirements change. Material updates will be posted on this page with a revised effective date.",
      "For privacy questions or requests, contact support@sharpsharpride.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#061116] px-5 py-14 text-white lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-400">
            SharpSharp Ride Legal
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">Privacy Policy</h1>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            This policy explains how SharpSharp Ride collects, uses, protects,
            and shares information when you use our ride, rental, driver, and
            related platform services.
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
            By using SharpSharp Ride, you acknowledge that you have read this
            Privacy Policy together with our Terms of Service.
          </p>
          <Link
            href="/terms"
            className="mt-5 inline-flex rounded-full bg-emerald-500 px-7 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400"
          >
            Read Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
