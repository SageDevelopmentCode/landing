"use server";

import { createAdminClient, createServerSupabaseClient } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { type FeedReactionSummary, type FeedCommentRow } from "./actions";
import { DEFAULT_REACTIONS } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReelPost = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_role: string;
  teacher_profile_image_url: string | null;
  caption: string;
  storage_url: string | null;   // signed URL at read time; null until video uploaded
  duration_secs: number | null;
  school_year: string;
  created_at: string;
  reactions: FeedReactionSummary[];
  comments: FeedCommentRow[];
};

// ─── Fetch Reels ──────────────────────────────────────────────────────────────

export async function getReels(): Promise<ReelPost[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  const { data: reels, error } = await adminClient
    .schema("reels")
    .from("posts")
    .select(`
      id,
      teacher_id,
      caption,
      storage_url,
      duration_secs,
      school_year,
      created_at,
      reactions ( reel_id, user_id, emoji ),
      comments ( id, author_id, body, created_at, is_deleted, parent_comment_id )
    `)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error || !reels) {
    console.error("[getReels] DB error:", error?.message, error?.details ?? "");
    return [];
  }

  // Collect unique user IDs (teachers + comment authors)
  const userIds = new Set<string>();
  for (const r of reels) {
    userIds.add(r.teacher_id);
    for (const c of (r.comments ?? [])) {
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

  // Batch-generate signed URLs for all reel videos
  const videoPaths = reels
    .filter((r) => r.storage_url)
    .map((r) => r.storage_url as string);

  const signedResult =
    videoPaths.length > 0
      ? await adminClient.storage.from("feed-media").createSignedUrls(videoPaths, 3600)
      : { data: [] };

  const videoUrlMap = new Map(
    (signedResult.data ?? []).map((r) => [r.path, r.signedUrl])
  );

  console.log("[getReels] returning", reels.length, "reels");
  return reels.map((r) => {
    const teacher = userMap.get(r.teacher_id);

    const reactionMap = new Map<string, { count: number; reacted_by_me: boolean }>();
    for (const rx of (r.reactions ?? [])) {
      const existing = reactionMap.get(rx.emoji) ?? { count: 0, reacted_by_me: false };
      reactionMap.set(rx.emoji, {
        count: existing.count + 1,
        reacted_by_me: existing.reacted_by_me || rx.user_id === user?.id,
      });
    }

    return {
      id: r.id,
      teacher_id: r.teacher_id,
      teacher_name: teacher?.full_name ?? "Unknown",
      teacher_role: teacher?.role ?? "Teacher",
      teacher_profile_image_url: teacher?.profile_image_url ?? null,
      caption: r.caption ?? "",
      storage_url: r.storage_url ? (videoUrlMap.get(r.storage_url) ?? null) : null,
      duration_secs: r.duration_secs ?? null,
      school_year: r.school_year,
      created_at: r.created_at,
      reactions: [
        ...DEFAULT_REACTIONS.map((emoji) => {
          const existing = reactionMap.get(emoji);
          return { emoji, count: existing?.count ?? 0, reacted_by_me: existing?.reacted_by_me ?? false };
        }),
        ...Array.from(reactionMap.entries())
          .filter(([emoji]) => !DEFAULT_REACTIONS.includes(emoji))
          .map(([emoji, { count, reacted_by_me }]) => ({ emoji, count, reacted_by_me })),
      ],
      comments: (r.comments ?? [])
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

// ─── Create Reel ──────────────────────────────────────────────────────────────

export async function createReel(formData: FormData): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const caption = (formData.get("caption") as string)?.trim() ?? "";
  const school_year = (formData.get("school_year") as string) || "2025-2026";

  const adminClient = createAdminClient();

  const { data: reel, error } = await adminClient
    .schema("reels")
    .from("posts")
    .insert({ teacher_id: user.id, caption, school_year })
    .select("id")
    .single();

  if (error || !reel) {
    console.error("[createReel] DB insert error:", error?.message, error?.details ?? "");
    throw new Error(error?.message ?? "Failed to create reel");
  }

  revalidatePath("/teacher/feed");
  return reel.id;
}

// ─── Update Reel Storage Path ─────────────────────────────────────────────────
// Called after the client uploads the video directly to Supabase Storage.
// Only persists the resulting path — no binary data passes through the Server Action.

export async function updateReelStoragePath(
  reelId: string,
  storagePath: string,
  durationSecs: number | null,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("reels")
    .from("posts")
    .update({ storage_url: storagePath, duration_secs: durationSecs })
    .eq("id", reelId)
    .eq("teacher_id", user.id);

  if (error) {
    console.error("[updateReelStoragePath] DB update error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/teacher/feed");
  return {};
}

// ─── Delete Reel ─────────────────────────────────────────────────────────────

export async function deleteReel(reelId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("reels")
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", reelId)
    .eq("teacher_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/feed");
}

// ─── Toggle Reel Reaction ─────────────────────────────────────────────────────

export async function toggleReelReaction(
  reelId: string,
  emoji: string
): Promise<{ added: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .schema("reels")
    .from("reactions")
    .select("reel_id")
    .eq("reel_id", reelId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await adminClient
      .schema("reels")
      .from("reactions")
      .delete()
      .eq("reel_id", reelId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);
    revalidatePath("/teacher/feed");
    return { added: false };
  } else {
    await adminClient
      .schema("reels")
      .from("reactions")
      .insert({ reel_id: reelId, user_id: user.id, emoji });
    revalidatePath("/teacher/feed");
    return { added: true };
  }
}

// ─── Add Reel Comment ─────────────────────────────────────────────────────────

export async function addReelComment(
  reelId: string,
  body: string,
  parentCommentId?: string | null
): Promise<FeedCommentRow> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!body.trim()) throw new Error("Comment cannot be empty");

  const adminClient = createAdminClient();

  const { data: comment, error } = await adminClient
    .schema("reels")
    .from("comments")
    .insert({
      reel_id: reelId,
      author_id: user.id,
      body: body.trim(),
      ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
    })
    .select("id, author_id, body, created_at, parent_comment_id")
    .single();

  if (error || !comment) throw new Error(error?.message ?? "Failed to add comment");

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

// ─── Delete Reel Comment ──────────────────────────────────────────────────────

export async function deleteReelComment(commentId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("reels")
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/feed");
}
