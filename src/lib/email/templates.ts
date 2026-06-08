import { emailLayout } from "./emailLayout";

export function driverApplicationSubmittedTemplate(name: string) {
  return {
    subject: "Driver Application Received",
    html: emailLayout(
      "Driver Application Received",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Hello ${name},
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Thank you for applying to become a SharpSharp Ride driver.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Your application has been received and is currently under review.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Our team will review your information and notify you once verification has been completed.
        </p>

        <div style="margin-top:30px;text-align:center;">
          <a
            href="https://www.sharpsharpride.com/apply/driver/review"
            style="
              display:inline-block;
              background:#18c37e;
              color:#04130c;
              padding:14px 28px;
              border-radius:999px;
              text-decoration:none;
              font-weight:700;
            "
          >
            View Application Status
          </a>
        </div>
      `
    ),
  };
}

export function driverApprovedTemplate(name: string) {
  return {
    subject: "Driver Application Approved",
    html: emailLayout(
      "Congratulations 🎉",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Hello ${name},
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Your driver application has been approved.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          You can now start offering rides on SharpSharp Ride.
        </p>

        <div style="margin-top:30px;text-align:center;">
          <a
            href="https://www.sharpsharpride.com/offer-a-ride/create"
            style="
              display:inline-block;
              background:#18c37e;
              color:#04130c;
              padding:14px 28px;
              border-radius:999px;
              text-decoration:none;
              font-weight:700;
            "
          >
            Offer Your First Ride
          </a>
        </div>
      `
    ),
  };
}

export function driverRejectedTemplate(name: string) {
  return {
    subject: "Driver Application Update",
    html: emailLayout(
      "Application Update",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Hello ${name},
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Thank you for your interest in becoming a SharpSharp Ride driver.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Unfortunately, your application was not approved at this time.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          You may review your details and apply again in the future.
        </p>

        <div style="margin-top:30px;text-align:center;">
          <a
            href="https://www.sharpsharpride.com/apply/driver"
            style="
              display:inline-block;
              background:#18c37e;
              color:#04130c;
              padding:14px 28px;
              border-radius:999px;
              text-decoration:none;
              font-weight:700;
            "
          >
            Reapply
          </a>
        </div>
      `
    ),
  };
}

export function rideRequestSubmittedTemplate({
  name,
  fromCity,
  toCity,
  travelDate,
}: {
  name: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
}) {
  return {
    subject: "Ride Request Received",
    html: emailLayout(
      "Ride Request Received",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Hello ${name},
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Your ride request from <strong>${fromCity}</strong> to <strong>${toCity}</strong> has been received.
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Travel Date: <strong>${travelDate}</strong>
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Our team will review your request and notify you once a ride is available or assigned.
        </p>

        <div style="margin-top:30px;text-align:center;">
          <a
            href="https://www.sharpsharpride.com/dashboard"
            style="
              display:inline-block;
              background:#18c37e;
              color:#04130c;
              padding:14px 28px;
              border-radius:999px;
              text-decoration:none;
              font-weight:700;
            "
          >
            View Dashboard
          </a>
        </div>
      `
    ),
  };
}