import { resend } from "./resend";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

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
    const result = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}