import { NextResponse } from "next/server";
import { sendDriverStatusEmail } from "@/lib/email/sendDriverStatusEmail";

export async function GET() {
  const result = await sendDriverStatusEmail(
    "janeonovae17@gmail.com",
    "Jane Onovae",
    "approved"
  );

  return NextResponse.json(result);
}