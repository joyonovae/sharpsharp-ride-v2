"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { rideAssignedTemplate } from "@/lib/email/templates";

type AssignmentResult = {
  changed: boolean;
  request_id: string;
  ride_id: string;
  passenger_id: string | null;
  passenger_name: string | null;
  driver_id: string | null;
  driver_name: string | null;
  from_city: string;
  to_city: string;
  travel_date: string;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Not authorized");
  }

  return createAdminClient();
}

export async function markRideRequestMatched(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");

  if (!requestId) {
    throw new Error("Missing request ID");
  }

  const { data: request, error: requestError } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error(requestError?.message || "Ride request not found");
  }

  const { error: updateError } = await supabase
    .from("ride_requests")
    .update({
      status: "matched",
      admin_note: "Passenger request has been matched by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (request.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Ride request matched",
      message: `Your ${request.from_city} → ${request.to_city} ride request for ${request.travel_date} has been matched.`,
      type: "ride_request_matched",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath("/dashboard");
}

export async function cancelRideRequest(formData: FormData) {
  const supabase = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");

  if (!requestId) {
    throw new Error("Missing request ID");
  }

  const { data: request, error: requestError } = await supabase
    .from("ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error(requestError?.message || "Ride request not found");
  }

  const { error: updateError } = await supabase
    .from("ride_requests")
    .update({
      status: "cancelled",
      admin_note: "Passenger request was cancelled by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (request.user_id) {
    await createNotification({
      userId: request.user_id,
      title: "Ride request cancelled",
      message: `Your ${request.from_city} → ${request.to_city} ride request has been cancelled.`,
      type: "ride_request_cancelled",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath("/dashboard");
}

export async function assignRideToRequest(formData: FormData) {
  const admin = await requireAdmin();

  const requestId = String(formData.get("requestId") || "");
  const rideId = String(formData.get("rideId") || "");

  if (!requestId || !rideId) {
    throw new Error("Missing assignment details");
  }

  const { data, error } = await admin.rpc("assign_ride_request_to_ride", {
    p_request_id: requestId,
    p_ride_id: rideId,
  });

  if (error || !data) {
    throw new Error(error?.message || "Could not assign ride request");
  }

  const assignment = data as AssignmentResult;

  if (assignment.changed && assignment.passenger_id) {
    await createNotification({
      userId: assignment.passenger_id,
      title: "Ride assigned",
      message: `Your ride request from ${assignment.from_city} to ${assignment.to_city} has been assigned to a driver.`,
      type: "ride_assigned",
      link: "/dashboard",
    });
  }

  if (
    assignment.changed &&
    assignment.driver_id &&
    assignment.driver_id !== assignment.passenger_id
  ) {
    await createNotification({
      userId: assignment.driver_id,
      title: "New ride request assigned",
      message: `A passenger request from ${assignment.from_city} to ${assignment.to_city} has been assigned to you.`,
      type: "ride_assigned",
      link: "/dashboard/driver",
    });
  }

  if (assignment.changed) {
    await Promise.all([
      sendAssignmentEmail(assignment, "passenger"),
      sendAssignmentEmail(assignment, "driver"),
    ]);
  }

  revalidatePath("/admin/ride-requests");
  revalidatePath(`/admin/ride-requests/${requestId}`);
  revalidatePath("/rides");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/driver");
}

async function sendAssignmentEmail(
  assignment: AssignmentResult,
  audience: "passenger" | "driver"
) {
  const userId =
    audience === "passenger" ? assignment.passenger_id : assignment.driver_id;

  if (!userId) return;

  const email = await getAuthUserEmail(userId);
  if (!email) {
    console.error(`Assignment email skipped: ${audience} email is missing.`);
    return;
  }

  const template = rideAssignedTemplate({
    name:
      audience === "passenger"
        ? assignment.passenger_name || "Passenger"
        : assignment.driver_name || "Driver",
    audience,
    fromCity: assignment.from_city,
    toCity: assignment.to_city,
    travelDate: assignment.travel_date,
  });

  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  if (!result.success) {
    console.error(`${audience} assignment email failed:`, result.error);
  }
}
