import BookingSuccessClient from "./BookingSuccessClient";

export const dynamic = "force-dynamic"; // ✅ THIS IS THE FIX

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{
    reference?: string;
  }>;
}) {
  const params = await searchParams;
  const reference = params?.reference || "";

  return <BookingSuccessClient reference={reference} />;
}