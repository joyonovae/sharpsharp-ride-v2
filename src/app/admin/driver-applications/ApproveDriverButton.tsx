"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ApproveDriverButton({
  appId,
}: {
  appId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/driver-applications/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Approval failed.");
        return;
      }

      alert("Driver approved successfully.");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#04130c] transition hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
    >
      <CheckCircle2 className="h-5 w-5" />

      {loading ? "Approving..." : "Approve Driver"}
    </button>
  );
}