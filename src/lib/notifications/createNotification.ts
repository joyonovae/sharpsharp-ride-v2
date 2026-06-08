import { createAdminClient } from "@/lib/supabase/admin";

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
};

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link = null,
}: CreateNotificationParams) {
  const supabase = createAdminClient();

  if (!userId || !title || !message) {
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
    is_read: false,
  });

  if (error) {
    console.error("Notification creation failed:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
