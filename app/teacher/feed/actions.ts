"use server";

import { createAdminClient, createServerSupabaseClient } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedMediaRow = {
  id: string;
  kind: "image" | "video";
  storage_url: string;
  display_order: number;
  duration_secs: number | null;
};

export type FeedAttachmentRow = {
  id: string;
  file_name: string;
  file_size_bytes: number | null;
  kind: "pdf" | "doc" | "sheet" | "other";
  storage_url: string;
};

export type FeedReactionSummary = {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
};

export type FeedCommentRow = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
};

export type FeedPost = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_role: string;
  teacher_profile_image_url: string | null;
  body: string;
  school_year: string;
  classroom: string | null;
  post_type: string | null;
  created_at: string;
  media: FeedMediaRow[];
  attachments: FeedAttachmentRow[];
  reactions: FeedReactionSummary[];
  comments: FeedCommentRow[];
};

import { DEFAULT_REACTIONS } from "./constants";

// ─── Fetch Posts ──────────────────────────────────────────────────────────────

export async function getFeedPosts(): Promise<FeedPost[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  const { data: posts, error } = await adminClient
    .schema("feed")
    .from("posts")
    .select(`
      id,
      teacher_id,
      body,
      school_year,
      classroom,
      post_type,
      created_at,
      post_media ( id, kind, storage_url, display_order, duration_secs ),
      post_attachments ( id, file_name, file_size_bytes, kind, storage_url ),
      post_reactions ( emoji, user_id ),
      post_comments ( id, author_id, body, created_at, is_deleted, parent_comment_id )
    `)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error || !posts) {
    console.error("[getFeedPosts] DB error:", error?.message, error?.details ?? "");
    return [];
  }

  // Collect all unique user IDs (teachers + comment authors)
  const userIds = new Set<string>();
  for (const p of posts) {
    userIds.add(p.teacher_id);
    for (const c of (p.post_comments ?? [])) {
      if (!c.is_deleted) userIds.add(c.author_id);
    }
  }

  const { data: adminUsers } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, role, profile_image_url")
    .in("id", Array.from(userIds));

  const userMap = new Map(
    (adminUsers ?? []).map((u) => [
      u.id,
      { full_name: u.full_name, role: u.role, profile_image_url: u.profile_image_url ?? null },
    ])
  );

  // Batch-generate signed URLs for all media and attachments (1 hour expiry)
  const allMediaPaths = posts.flatMap((p) =>
    (p.post_media ?? []).map((m: { storage_url: string }) => m.storage_url)
  );
  const allAttachmentPaths = posts.flatMap((p) =>
    (p.post_attachments ?? []).map((a: { storage_url: string }) => a.storage_url)
  );

  const [mediaSignedResult, attachmentSignedResult] = await Promise.all([
    allMediaPaths.length > 0
      ? adminClient.storage.from("feed-media").createSignedUrls(allMediaPaths, 3600)
      : Promise.resolve({ data: [] }),
    allAttachmentPaths.length > 0
      ? adminClient.storage.from("feed-attachments").createSignedUrls(allAttachmentPaths, 3600)
      : Promise.resolve({ data: [] }),
  ]);

  // Build path → signedUrl maps
  const mediaUrlMap = new Map(
    (mediaSignedResult.data ?? []).map((r) => [r.path, r.signedUrl])
  );
  const attachmentUrlMap = new Map(
    (attachmentSignedResult.data ?? []).map((r) => [r.path, r.signedUrl])
  );

  console.log("[getFeedPosts] returning", posts.length, "posts");
  return posts.map((p) => {
    const teacher = userMap.get(p.teacher_id);

    // Aggregate reactions
    const reactionMap = new Map<string, { count: number; reacted_by_me: boolean }>();
    for (const r of (p.post_reactions ?? [])) {
      const existing = reactionMap.get(r.emoji) ?? { count: 0, reacted_by_me: false };
      reactionMap.set(r.emoji, {
        count: existing.count + 1,
        reacted_by_me: existing.reacted_by_me || r.user_id === user?.id,
      });
    }

    return {
      id: p.id,
      teacher_id: p.teacher_id,
      teacher_name: teacher?.full_name ?? "Unknown",
      teacher_role: teacher?.role ?? "Teacher",
      teacher_profile_image_url: teacher?.profile_image_url ?? null,
      body: p.body,
      school_year: p.school_year,
      classroom: p.classroom,
      post_type: p.post_type ?? null,
      created_at: p.created_at,
      media: ((p.post_media ?? []) as FeedMediaRow[])
        .sort((a, b) => a.display_order - b.display_order)
        .map((m) => ({
          ...m,
          storage_url: mediaUrlMap.get(m.storage_url) ?? m.storage_url,
        })),
      attachments: ((p.post_attachments ?? []) as FeedAttachmentRow[]).map((a) => ({
        ...a,
        storage_url: attachmentUrlMap.get(a.storage_url) ?? a.storage_url,
      })),
      reactions: [
        ...DEFAULT_REACTIONS.map((emoji) => {
          const existing = reactionMap.get(emoji);
          return { emoji, count: existing?.count ?? 0, reacted_by_me: existing?.reacted_by_me ?? false };
        }),
        ...Array.from(reactionMap.entries())
          .filter(([emoji]) => !DEFAULT_REACTIONS.includes(emoji))
          .map(([emoji, { count, reacted_by_me }]) => ({ emoji, count, reacted_by_me })),
      ],
      comments: (p.post_comments ?? [])
        .filter((c) => !c.is_deleted)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c) => ({
          id: c.id,
          author_id: c.author_id,
          author_name: userMap.get(c.author_id)?.full_name ?? "Unknown",
          body: c.body,
          created_at: c.created_at,
          parent_comment_id: c.parent_comment_id ?? null,
        })),
    };
  });
}

// ─── Create Post ──────────────────────────────────────────────────────────────

export async function createPost(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const body = formData.get("body") as string;
  const school_year = (formData.get("school_year") as string) || "2025-2026";
  const classroom = (formData.get("classroom") as string) || null;
  const post_type = (formData.get("post_type") as string) || "announcement";

  if (!body?.trim()) throw new Error("Post body is required");

  const adminClient = createAdminClient();

  const { data: post, error } = await adminClient
    .schema("feed")
    .from("posts")
    .insert({ teacher_id: user.id, body: body.trim(), school_year, classroom, post_type })
    .select("id")
    .single();

  if (error || !post) {
    console.error("[createPost] DB insert error:", error?.message, error?.details ?? "");
    throw new Error(error?.message ?? "Failed to create post");
  }

  revalidatePath("/teacher/feed");
  return post.id;
}

// ─── Upload Feed Media (image or video) ───────────────────────────────────────

export async function uploadFeedMedia(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const postId = formData.get("postId") as string;
  const file = formData.get("file") as File;
  const displayOrder = Number(formData.get("displayOrder") ?? 0);
  const durationSecs = formData.get("durationSecs")
    ? Number(formData.get("durationSecs"))
    : null;

  if (!postId || !file) return { error: "Missing required fields" };

  const isVideo = file.type.startsWith("video/");
  const kind: "image" | "video" = isVideo ? "video" : "image";

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${postId}/${timestamp}-${safeName}`;

  const adminClient = createAdminClient();

  const { error: uploadError } = await adminClient.storage
    .from("feed-media")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadFeedMedia] storage upload error:", uploadError.message);
    return { error: uploadError.message };
  }

  const { error: dbError } = await adminClient
    .schema("feed")
    .from("post_media")
    .insert({
      post_id: postId,
      kind,
      storage_url: storagePath,   // store the path; signed URLs generated at read time
      display_order: displayOrder,
      duration_secs: durationSecs,
    });

  if (dbError) {
    console.error("[uploadFeedMedia] DB insert error:", dbError.message);
    return { error: dbError.message };
  }

  revalidatePath("/teacher/feed");
  return {};
}

// ─── Upload Feed Attachment (PDF / doc / sheet) ───────────────────────────────

export async function uploadFeedAttachment(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const postId = formData.get("postId") as string;
  const file = formData.get("file") as File;

  if (!postId || !file) return { error: "Missing required fields" };

  const mime = file.type;
  let kind: "pdf" | "doc" | "sheet" | "other" = "other";
  if (mime === "application/pdf") kind = "pdf";
  else if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    kind = "doc";
  else if (
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    kind = "sheet";

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${postId}/${timestamp}-${safeName}`;

  const adminClient = createAdminClient();

  const { error: uploadError } = await adminClient.storage
    .from("feed-attachments")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await adminClient
    .schema("feed")
    .from("post_attachments")
    .insert({
      post_id: postId,
      file_name: file.name,
      file_size_bytes: file.size,
      kind,
      storage_url: storagePath,   // store the path; signed URLs generated at read time
    });

  if (dbError) return { error: dbError.message };

  revalidatePath("/teacher/feed");
  return {};
}

// ─── Delete Post ──────────────────────────────────────────────────────────────

export async function deletePost(postId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("feed")
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", postId)
    .eq("teacher_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/feed");
}

// ─── Add Comment ──────────────────────────────────────────────────────────────

export async function addComment(postId: string, body: string, parentCommentId?: string | null): Promise<FeedCommentRow> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!body.trim()) throw new Error("Comment cannot be empty");

  const adminClient = createAdminClient();

  const { data: comment, error } = await adminClient
    .schema("feed")
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      body: body.trim(),
      ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
    })
    .select("id, author_id, body, created_at, parent_comment_id")
    .single();

  if (error || !comment) throw new Error(error?.message ?? "Failed to add comment");

  // Fetch author name
  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  revalidatePath("/teacher/feed");

  return {
    id: comment.id,
    author_id: comment.author_id,
    author_name: adminUser?.full_name ?? "Unknown",
    body: comment.body,
    created_at: comment.created_at,
    parent_comment_id: comment.parent_comment_id ?? null,
  };
}

// ─── Delete Comment ───────────────────────────────────────────────────────────

export async function deleteComment(commentId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("feed")
    .from("post_comments")
    .update({ is_deleted: true })
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/feed");
}

// ─── Toggle Reaction ──────────────────────────────────────────────────────────

export async function toggleReaction(
  postId: string,
  emoji: string
): Promise<{ added: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  // Check if the reaction already exists
  const { data: existing } = await adminClient
    .schema("feed")
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await adminClient
      .schema("feed")
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);
    revalidatePath("/teacher/feed");
    return { added: false };
  } else {
    await adminClient
      .schema("feed")
      .from("post_reactions")
      .insert({ post_id: postId, user_id: user.id, emoji });
    revalidatePath("/teacher/feed");
    return { added: true };
  }
}

// ─── Update Post ──────────────────────────────────────────────────────────────

export async function updatePost(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const postId = formData.get("postId") as string;
  const body = (formData.get("body") as string)?.trim();
  const postType = formData.get("post_type") as string;

  if (!body) return { error: "Body is required" };

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("feed")
    .from("posts")
    .update({ body, post_type: postType })
    .eq("id", postId)
    .eq("teacher_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/teacher/feed");
  return { success: true };
}

// ─── Delete Post Media ────────────────────────────────────────────────────────

export async function deletePostMedia(mediaId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  const { data: media } = await adminClient
    .schema("feed")
    .from("post_media")
    .select("storage_url, post_id")
    .eq("id", mediaId)
    .single();

  if (!media) return { error: "Not found" };

  await adminClient.storage.from("feed-media").remove([media.storage_url]);

  const { error } = await adminClient
    .schema("feed")
    .from("post_media")
    .delete()
    .eq("id", mediaId);

  if (error) return { error: error.message };
  return { success: true };
}
