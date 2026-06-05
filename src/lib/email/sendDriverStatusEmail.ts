import { sendEmail } from "./sendEmail";
import {
  driverApprovedTemplate,
  driverRejectedTemplate,
} from "./templates";

type DriverStatus = "approved" | "rejected";

export async function sendDriverStatusEmail(
  email: string,
  fullName: string,
  status: DriverStatus
) {
  const template =
    status === "approved"
      ? driverApprovedTemplate(fullName)
      : driverRejectedTemplate(fullName);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}