import { createClient } from "@/lib/supabase/server";

export async function createNotification({
  userId,
  title,
  message,
  type = "general",
  actionUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
}) {
  const supabase = await createClient();

  if (!userId || !title || !message) {
    return { error: "Missing notification fields" };
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl || null,
    is_read: false,
  });

  if (error) {
    console.error("Notification error:", error.message);
    return { error: error.message };
  }

  return { success: true };
}