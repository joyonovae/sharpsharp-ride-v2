import RentalBookingSuccessClient from "./RentalBookingSuccessClient";
export const dynamic = "force-dynamic";
export default async function RentalBookingSuccessPage({ searchParams }: { searchParams?: Promise<{ reference?: string }> }) {
  const params = await searchParams;
  return <RentalBookingSuccessClient reference={params?.reference || ""}/>;
}
