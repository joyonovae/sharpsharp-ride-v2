import BookingSuccessClient from "./BookingSuccessClient";

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