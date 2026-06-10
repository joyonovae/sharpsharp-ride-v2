import { submitRideReview } from "@/app/actions/reviews";

export function ReviewForm({
  bookingId,
  context,
  label,
}: {
  bookingId: string;
  context: "driver" | "passenger";
  label: string;
}) {
  return (
    <form action={submitRideReview} className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="context" value={context} />
      <p className="font-bold text-emerald-300">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
        <select name="rating" required className="rounded-xl border border-white/10 bg-[#0b1d26] px-3 py-2 text-white">
          <option value="">Rating</option>
          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
        </select>
        <input name="comment" maxLength={1000} placeholder="Optional comment" className="rounded-xl border border-white/10 bg-[#0b1d26] px-3 py-2 text-white placeholder:text-white/40" />
        <button className="rounded-xl bg-emerald-500 px-5 py-2 font-bold text-[#04130c]">Submit Review</button>
      </div>
    </form>
  );
}
