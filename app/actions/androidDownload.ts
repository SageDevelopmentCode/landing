"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export type AndroidDownloadResponse = {
  success: boolean;
  message: string;
};

export async function submitAndroidDownloadRequest(
  email: string,
): Promise<AndroidDownloadResponse> {
  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: "Please enter a valid email address." };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .schema("admin")
      .from("android_download_requests")
      .insert({ email });

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    // Fire Discord notification (non-blocking)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/notify/discord`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-notify-key": process.env.DISCORD_NOTIFY_KEY ?? "",
          },
          body: JSON.stringify({
            type: "android_download_request",
            data: { email },
          }),
        },
      );
    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return {
      success: true,
      message: "Got it! We'll send you the download link shortly.",
    };
  } catch (error) {
    console.error("Android download request error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
