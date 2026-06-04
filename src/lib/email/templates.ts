export function driverApplicationSubmittedTemplate(name: string) {
  return {
    subject: "Driver Application Received",
    html: `
      <div style="font-family:Arial,sans-serif;padding:32px;">
        <h1>Driver Application Received</h1>

        <p>Hello ${name},</p>

        <p>
          Thank you for applying to become a SharpSharp Ride driver.
        </p>

        <p>
          Your application has been received and is currently under review.
        </p>

        <p>
          We will notify you once our team has completed the verification process.
        </p>

        <p>
          Thank you for choosing SharpSharp Ride.
        </p>
      </div>
    `,
  };
}

export function driverApprovedTemplate(name: string) {
  return {
    subject: "Driver Application Approved",
    html: `
      <div style="font-family:Arial,sans-serif;padding:32px;">
        <h1>Congratulations 🎉</h1>

        <p>Hello ${name},</p>

        <p>
          Your driver application has been approved.
        </p>

        <p>
          You can now log in and start offering rides on SharpSharp Ride.
        </p>

        <p>
          Welcome to the driver community.
        </p>
      </div>
    `,
  };
}

export function driverRejectedTemplate(name: string) {
  return {
    subject: "Driver Application Update",
    html: `
      <div style="font-family:Arial,sans-serif;padding:32px;">
        <h1>Application Update</h1>

        <p>Hello ${name},</p>

        <p>
          Thank you for your interest in becoming a SharpSharp Ride driver.
        </p>

        <p>
          Unfortunately, your application was not approved at this time.
        </p>

        <p>
          You may review your information and submit another application in the future.
        </p>
      </div>
    `,
  };
}