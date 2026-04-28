"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How do I book a ride?",
    answer:
      "Go to the rides page, select your preferred route, fill your details, and complete payment. Once payment is successful, your seat is confirmed.",
  },
  {
    question: "When is my seat confirmed?",
    answer:
      "Your seat is only confirmed after successful payment. Once payment is verified, the seat is deducted automatically.",
  },
  {
    question: "Can I cancel a booking?",
    answer:
      "For now, cancellations are handled manually. Contact support with your booking reference.",
  },
  {
    question: "How do I become a driver?",
    answer:
      "Sign up, go to your dashboard, and apply as a driver. Once approved, you can start offering rides.",
  },
  {
    question: "How long does driver approval take?",
    answer:
      "Driver applications are reviewed by the admin. You’ll be notified once approved.",
  },
  {
    question: "Are payments secure?",
    answer:
      "Yes. All payments are processed securely through Paystack.",
  },
  {
    question: "Can I rent a car?",
    answer:
      "Yes. You can browse available cars on the rent page. More vehicles will be added over time.",
  },
  {
    question: "Is delivery available?",
    answer:
      "Delivery is currently limited and will be expanded soon.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <main className="min-h-screen bg-[#061116] px-5 py-14 text-white lg:px-12">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-4xl font-black">Frequently Asked Questions</h1>
          <p className="mt-3 text-white/70">
            Everything you need to know about using SharpSharp Ride.
          </p>
        </div>

        {/* FAQ LIST */}
        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-lg font-bold">{faq.question}</h3>
                <span className="text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <p className="mt-4 text-sm text-white/70 leading-7">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}