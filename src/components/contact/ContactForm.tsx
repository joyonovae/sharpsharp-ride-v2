"use client";

import { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess("Message sent successfully 🎉");
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="name"
          type="text"
          placeholder="Full name"
          required
          className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none"
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none"
        />
      </div>

      <input
        name="subject"
        type="text"
        placeholder="Subject"
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none"
      />

      <textarea
        name="message"
        placeholder="Message"
        rows={6}
        required
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="h-14 w-full rounded-full bg-emerald-500 font-bold text-[#04130c] transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>

      {success && <p className="text-sm text-green-400">{success}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}