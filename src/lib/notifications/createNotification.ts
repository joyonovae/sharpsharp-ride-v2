import { createAdminClient } from "@/lib/supabase/admin";

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  dedupeKey?: string | null;
};

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link = null,
  dedupeKey = null,
}: CreateNotificationParams) {
  const supabase = createAdminClient();

  if (!userId || !title || !message) {
    return { success: false, created: false, error: "Missing notification details" };
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
    dedupe_key: dedupeKey,
    is_read: false,
  });

  if (error) {
    if (error.code === "23505" && dedupeKey) {
      return { success: true, created: false, duplicate: true };
    }

    console.error("Notification creation failed:", error.message);
    return { success: false, created: false, error: error.message };
  }

  return { success: true, created: true };
}
