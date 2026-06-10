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

export function rideAssignedTemplate({
  name,
  audience,
  fromCity,
  toCity,
  travelDate,
  link,
}: {
  name: string;
  audience: "passenger" | "driver";
  fromCity: string;
  toCity: string;
  travelDate: string;
  link: string;
}) {
  const message =
    audience === "driver"
      ? `A passenger ride request from <strong>${fromCity}</strong> to <strong>${toCity}</strong> has been assigned to you.`
      : `Your ride request from <strong>${fromCity}</strong> to <strong>${toCity}</strong> has been assigned to a driver.`;

  return {
    subject:
      audience === "driver"
        ? "New Ride Request Assigned"
        : "Your Ride Request Has Been Assigned",
    html: emailLayout(
      "Ride Assigned",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Hello ${name},
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          ${message}
        </p>

        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Travel Date: <strong>${travelDate}</strong>
        </p>

        <div style="margin-top:30px;text-align:center;">
          <a
            href="https://www.sharpsharpride.com${link}"
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
            ${audience === "passenger" ? "Book Assigned Ride" : "View Driver Dashboard"}
          </a>
        </div>
      `
    ),
  };
}

export function rideRequestStatusTemplate({
  name,
  status,
  fromCity,
  toCity,
  travelDate,
}: {
  name: string;
  status: "matched" | "cancelled";
  fromCity: string;
  toCity: string;
  travelDate: string;
}) {
  const matched = status === "matched";

  return {
    subject: matched ? "Your Ride Request Was Matched" : "Ride Request Cancelled",
    html: emailLayout(
      matched ? "Ride Request Matched" : "Ride Request Cancelled",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          Your ride request from <strong>${fromCity}</strong> to <strong>${toCity}</strong>
          for <strong>${travelDate}</strong> has been ${matched ? "matched. We will notify you when a ride is assigned." : "cancelled."}
        </p>
      `
    ),
  };
}

export function bookingConfirmedTemplate({
  name,
  audience,
  fromCity,
  toCity,
  seats,
}: {
  name: string;
  audience: "passenger" | "driver";
  fromCity: string;
  toCity: string;
  seats: number;
}) {
  const passenger = audience === "passenger";

  return {
    subject: passenger ? "Ride Booking Confirmed" : "New Paid Passenger Booking",
    html: emailLayout(
      passenger ? "Booking Confirmed" : "New Passenger Booking",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          ${passenger ? "Your payment was verified and your booking is confirmed" : `A passenger paid for ${seats} seat${seats === 1 ? "" : "s"}`}
          for the ride from <strong>${fromCity}</strong> to <strong>${toCity}</strong>.
        </p>
      `
    ),
  };
}

export function adminOperationalTemplate({
  name,
  title,
  message,
  details,
  link,
}: {
  name: string;
  title: string;
  message: string;
  details?: string;
  link: string;
}) {
  return {
    subject: title,
    html: emailLayout(
      title,
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.8;color:#334155;">${message}</p>
        ${details ? `<p style="font-size:14px;line-height:1.8;color:#64748b;">${details}</p>` : ""}
        <div style="margin-top:30px;text-align:center;">
          <a href="https://www.sharpsharpride.com${link}" style="display:inline-block;background:#18c37e;color:#04130c;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;">Open Admin Panel</a>
        </div>
      `
    ),
  };
}

export function tripCompletedTemplate({
  name,
  audience,
  fromCity,
  toCity,
}: {
  name: string;
  audience: "passenger" | "driver";
  fromCity: string;
  toCity: string;
}) {
  return {
    subject: "Trip Completed",
    html: emailLayout(
      "Trip Completed",
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.8;color:#334155;">
          ${audience === "passenger" ? "Your" : "Your passenger"} trip from
          <strong>${fromCity}</strong> to <strong>${toCity}</strong> has been marked completed.
        </p>
      `
    ),
  };
}

export function rentalApplicationTemplate({
  name,
  status,
  vehicle,
  note,
}: {
  name: string;
  status: "submitted" | "approved" | "rejected";
  vehicle: string;
  note?: string | null;
}) {
  const titles = {
    submitted: "Rental Vehicle Application Received",
    approved: "Rental Vehicle Application Approved",
    rejected: "Rental Vehicle Application Update",
  };
  const messages = {
    submitted: `Your application to list <strong>${vehicle}</strong> has been received and is awaiting review.`,
    approved: `Your application for <strong>${vehicle}</strong> has been approved and the vehicle is now published.`,
    rejected: `Your application for <strong>${vehicle}</strong> was not approved at this time.`,
  };

  return {
    subject: titles[status],
    html: emailLayout(
      titles[status],
      `
        <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.8;color:#334155;">${messages[status]}</p>
        ${note ? `<p style="font-size:14px;line-height:1.8;color:#64748b;">Admin note: ${note}</p>` : ""}
        <div style="margin-top:30px;text-align:center;">
          <a href="https://www.sharpsharpride.com/dashboard/rentals" style="display:inline-block;background:#18c37e;color:#04130c;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;">View Rental Applications</a>
        </div>
      `
    ),
  };
}

export function rentalBookingTemplate({
  name,
  audience,
  status,
  vehicle,
  startDate,
  endDate,
  totalAmount,
}: {
  name: string;
  audience: "renter" | "owner";
  status: "confirmed" | "completed" | "cancelled";
  vehicle: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
}) {
  const title = status === "confirmed" ? "Rental Booking Confirmed" : status === "completed" ? "Rental Booking Completed" : "Rental Booking Cancelled";
  const message = audience === "owner"
    ? `${vehicle} has a ${status} rental booking.`
    : `Your rental booking for ${vehicle} is ${status}.`;
  return {
    subject: title,
    html: emailLayout(title, `
      <p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p>
      <p style="font-size:16px;line-height:1.8;color:#334155;">${message}</p>
      <p style="font-size:14px;line-height:1.8;color:#64748b;">${startDate} to ${endDate} · NGN ${totalAmount.toLocaleString()}</p>
      <div style="margin-top:30px;text-align:center;"><a href="https://www.sharpsharpride.com/dashboard/rentals" style="display:inline-block;background:#18c37e;color:#04130c;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;">View Rental Bookings</a></div>
    `),
  };
}

export function accountStatusTemplate({ name, status, reason }: { name: string; status: "suspended" | "blocked" | "reinstated" | "review_rejected" | "driver_revoked"; reason?: string }) {
  const title = status === "driver_revoked" ? "Driver Access Revoked" : status === "reinstated" ? "Account Reinstated" : status === "review_rejected" ? "Suspension Review Update" : `Account ${status}`;
  return { subject: title, html: emailLayout(title, `<p style="font-size:16px;line-height:1.8;color:#334155;">Hello ${name},</p><p style="font-size:16px;line-height:1.8;color:#334155;">${status === "driver_revoked" ? "Your driver access has been revoked. Your historical rides and bookings remain available." : status === "reinstated" ? "Your account has been reinstated and is active again." : status === "review_rejected" ? "Your suspension review was not approved at this time." : `Your account has been ${status}.`}</p>${reason ? `<p style="font-size:14px;line-height:1.8;color:#64748b;">Reason: ${reason}</p>` : ""}<div style="margin-top:30px;text-align:center;"><a href="https://www.sharpsharpride.com/dashboard" style="display:inline-block;background:#18c37e;color:#04130c;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;">View Account</a></div>`) };
}
