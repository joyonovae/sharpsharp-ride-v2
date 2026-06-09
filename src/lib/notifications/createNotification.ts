import { createAdminClient } from "@/lib/supabase/admin";

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link: string;
  dedupeKey: string;
};

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link,
  dedupeKey,
}: CreateNotificationParams) {
  if (!userId || !title || !message || !link || !dedupeKey) {
    return { success: false, created: false, error: "Missing notification details" };
  }

  try {
    const supabase = createAdminClient();
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
      if (error.code === "23505") {
        return { success: true, created: false, duplicate: true };
      }

      console.error("Notification creation failed:", error.message);
      return { success: false, created: false, error: error.message };
    }

    return { success: true, created: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown notification error";
    console.error("Notification creation failed:", message);
    return { success: false, created: false, error: message };
  }
}
