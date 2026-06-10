import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { setReviewStatus } from "./actions";

export default async function AdminReviewsPage() {
  const { admin } = await requireAdminPage();
  const { data: reviews } = await admin.from("ride_reviews").select("id, rating, comment, context, status, created_at").order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#061116] px-4 py-10 text-white"><div className="mx-auto max-w-5xl space-y-5">
    <h1 className="text-4xl font-black">Review Moderation</h1>
    {!reviews?.length ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8">No reviews yet.</div> : reviews.map((review) =>
      <article key={review.id} className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex justify-between gap-4"><p className="font-black text-emerald-300">{review.rating}/5 · {review.context}</p><span className="uppercase text-slate-400">{review.status}</span></div><p className="mt-3 text-slate-300">{review.comment || "No written comment."}</p><form action={setReviewStatus} className="mt-4 flex gap-3"><input type="hidden" name="reviewId" value={review.id}/><button name="status" value="published" className="rounded-full bg-emerald-500 px-4 py-2 font-bold text-[#04130c]">Publish</button><button name="status" value="hidden" className="rounded-full border border-red-400/30 px-4 py-2 font-bold text-red-300">Hide</button></form></article>
    )}
  </div></main>;
}
