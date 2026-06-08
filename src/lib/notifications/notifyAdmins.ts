import { adminOperationalTemplate } from "@/lib/email/templates";
import { getAuthUserEmail } from "@/lib/email/getAuthUserEmail";
import { sendEmail } from "@/lib/email/sendEmail";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "./createNotification";

type NotifyAdminsParams = {
  title: string;
  message: string;
  type: string;
  link: string;
  dedupeKey: string;
  details?: string;
};

export async function notifyAdmins({
  title,
  message,
  type,
  link,
  dedupeKey,
  details,
}: NotifyAdminsParams) {
  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin");

    if (error) {
      console.error("Admin notification recipients could not be loaded:", error);
      return { success: false, emailDelivered: 0, error: error.message };
    }

    let emailDelivered = 0;
    const results = await Promise.all(
      (profiles || []).map(async (profile) => {
        const notification = await createNotification({
          userId: profile.id,
          title,
          message,
          type,
          link,
          dedupeKey,
        });

        if (!notification.success || !notification.created) {
          return notification;
        }

        const email = await getAuthUserEmail(profile.id);
        if (!email) return notification;

        const template = adminOperationalTemplate({
          name: profile.full_name || "Admin",
          title,
          message,
          details,
          link,
        });
        const emailResult = await sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
        });

        if (!emailResult.success) {
          console.error("Admin operational email failed:", emailResult.error);
        } else {
          emailDelivered += 1;
        }

        return notification;
      })
    );

    return {
      success: results.every((result) => result.success),
      emailDelivered,
      results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin alert error";
    console.error("Admin operational alert failed:", message);
    return { success: false, emailDelivered: 0, error: message };
  }
}
