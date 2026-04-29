import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}