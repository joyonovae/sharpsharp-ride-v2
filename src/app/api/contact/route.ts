import { NextResponse } from "next/server";
import { notifyAdmins } from "@/lib/notifications/notifyAdmins";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ] || character
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const adminResult = await notifyAdmins({
      title: subject || "New contact form submission",
      message: `${name} (${email}) sent a contact form message.`,
      details: escapeHtml(message),
      type: "admin_contact",
      link: "/admin",
      dedupeKey: `admin_contact:${crypto.randomUUID()}`,
    });

    if (!adminResult.success || adminResult.emailDelivered < 1) {
      return NextResponse.json(
        { error: "Message received, but the admin alert could not be delivered." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message received successfully.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
