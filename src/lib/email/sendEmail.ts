import { getResend } from "./resend";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown email error";
}

function getFromEmail() {
  const emailFrom = process.env.EMAIL_FROM || "support@sharpsharpride.com";

  if (emailFrom.includes("<")) {
    return emailFrom;
  }

  return `SharpSharp Ride <${emailFrom}>`;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend rejected email:", error);
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}
