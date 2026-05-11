"use server";

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";

export type ConversationWithMeta = {
  id: string;
  updated_at: string;
  otherUser: {
    id: string;
    full_name: string;
    role: string | null;
    profile_image_url: string | null;
  };
  lastMessage: {
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
};

export async function getConversations(userId: string): Promise<ConversationWithMeta[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("get_conversations_with_meta", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[getConversations] rpc error:", error);
    void sendDiscordNotification(
      createErrorEmbed({
        context: "getConversations – get_conversations_with_meta RPC",
        error: error.message,
        details: { userId },
      })
    ).catch(() => {});
    return [];
  }

  return (data ?? []).map((row: {
    conversation_id: string;
    updated_at: string;
    other_user_id: string;
    other_full_name: string | null;
    other_role: string | null;
    other_profile_image_url: string | null;
    last_message_body: string | null;
    last_message_created_at: string | null;
    last_message_sender_id: string | null;
    unread_count: number;
  }) => ({
    id: row.conversation_id,
    updated_at: row.updated_at,
    otherUser: {
      id: row.other_user_id,
      full_name: row.other_full_name ?? "Unknown",
      role: row.other_role ?? null,
      profile_image_url: row.other_profile_image_url ?? null,
    },
    lastMessage: row.last_message_body
      ? {
          body: row.last_message_body,
          created_at: row.last_message_created_at!,
          sender_id: row.last_message_sender_id!,
        }
      : null,
    unreadCount: Number(row.unread_count ?? 0),
  }));
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .schema("messaging")
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at, image_url, file_url, file_name")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  body: string,
  imageUrl?: string,
  fileUrl?: string,
  fileName?: string,
): Promise<MessageRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .schema("messaging")
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(fileUrl  ? { file_url: fileUrl, file_name: fileName ?? "attachment" } : {}),
    })
    .select()
    .single();

  if (error) return null;

  // Update conversation updated_at
  await supabase
    .schema("messaging")
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath("/parent/messages");
  return data;
}

export async function createConversation(
  currentUserId: string,
  recipientId: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  // Check if a 1-on-1 conversation already exists between these two users
  const { data: myConvos } = await supabase
    .schema("messaging")
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myConvos?.length) {
    const myConvoIds = myConvos.map((r) => r.conversation_id);
    const { data: sharedConvos } = await adminClient
      .schema("messaging")
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", recipientId)
      .in("conversation_id", myConvoIds);

    if (sharedConvos?.length) {
      return sharedConvos[0].conversation_id;
    }
  }

  // Use admin client for all writes — bypasses RLS for conversation creation
  const { data: newConvo, error: cErr } = await adminClient
    .schema("messaging")
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (cErr || !newConvo) {
    console.error("[createConversation] insert conversation error:", cErr);
    return null;
  }
  console.log("[createConversation] created conversation:", newConvo.id);

  const { error: p1Err } = await adminClient
    .schema("messaging")
    .from("conversation_participants")
    .insert({ conversation_id: newConvo.id, user_id: currentUserId });

  if (p1Err) {
    console.error("[createConversation] insert self participant error:", p1Err);
    return null;
  }
  console.log("[createConversation] inserted self participant:", currentUserId);

  const { error: p2Err } = await adminClient
    .schema("messaging")
    .from("conversation_participants")
    .insert({ conversation_id: newConvo.id, user_id: recipientId });

  if (p2Err) {
    console.error("[createConversation] insert other participant error:", p2Err);
    return null;
  }
  console.log("[createConversation] inserted other participant:", recipientId);

  return newConvo.id;
}

export async function searchUsers(query: string): Promise<{ id: string; full_name: string; profile_image_url: string | null }[]> {
  if (!query.trim()) return [];
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .ilike("full_name", `%${query}%`)
    .in("role", ["teacher", "super_admin"])
    .limit(10);

  if (error) return [];
  return (data ?? []).map((u) => ({ ...u, profile_image_url: u.profile_image_url ?? null }));
}

export async function uploadMessageImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("[uploadMessageImage] auth error:", authError);
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  const conversationId = formData.get("conversationId") as string;
  if (!file || !conversationId) {
    console.error("[uploadMessageImage] missing file or conversationId");
    return { error: "Missing fields" };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${conversationId}/${timestamp}-${safeName}`;

  // Use admin client to bypass RLS (same pattern as markMessagesRead)
  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from("message-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadMessageImage] storage upload error:", uploadError);
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = adminClient.storage
    .from("message-images")
    .getPublicUrl(path);

  console.log("[uploadMessageImage] success:", publicUrl);
  return { url: publicUrl };
}

export async function uploadMessageFile(
  formData: FormData
): Promise<{ url: string; name: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const conversationId = formData.get("conversationId") as string;
  if (!file || !conversationId) return { error: "Missing fields" };

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${conversationId}/${timestamp}-${safeName}`;

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from("message-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadMessageFile] storage upload error:", uploadError);
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = adminClient.storage
    .from("message-files")
    .getPublicUrl(path);

  console.log("[uploadMessageFile] success:", publicUrl);
  return { url: publicUrl, name: file.name };
}

export async function markMessagesRead(conversationId: string, userId: string): Promise<void> {
  const adminClient = createAdminClient();
  await adminClient
    .schema("messaging")
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export type TeacherOrAdmin = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  role: string;
};

export async function getTeachersAndAdmins(): Promise<TeacherOrAdmin[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url, role")
    .in("role", ["teacher", "super_admin"])
    .eq("is_deleted", false);

  if (error) return [];
  return (data ?? [])
    .map((u) => ({
      id: u.id,
      full_name: u.full_name,
      profile_image_url: u.profile_image_url ?? null,
      role: u.role,
    }))
    .sort((a, b) => {
      if (a.role === "super_admin" && b.role !== "super_admin") return -1;
      if (a.role !== "super_admin" && b.role === "super_admin") return 1;
      return 0;
    });
}
