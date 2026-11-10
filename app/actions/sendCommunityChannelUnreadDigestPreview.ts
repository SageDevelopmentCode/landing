"use server";

import { createAdminClient } from "@/app/lib/supabase-server";
import {
  buildCommunityChannelDigestForUser,
} from "@/app/lib/community-channel-unread-digest";
import {
  buildCommunityChannelUnreadDigestEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendCommunityChannelUnreadDigestPreview(opts: {
  email: string;
  g1FullName: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!opts.userId) {
    return { success: false, error: "No parent user account linked to application" };
  }

  const db = createAdminClient();

  const channels = await buildCommunityChannelDigestForUser(
    db,
    opts.userId,
    null,
  );

  if (!channels?.length) {
    return {
      success: false,
      error: "No new unread community messages for this parent's account",
    };
  }

  const { subject, content } = await buildCommunityChannelUnreadDigestEmail({
    parentFullName: opts.g1FullName,
    channels,
  });

  return sendZohoEmail({
    toAddress: opts.email,
    subject,
    content,
  });
}
