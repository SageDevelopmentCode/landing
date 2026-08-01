import { supabase } from "@/lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NewsletterSectionImage = {
  id: string;
  storage_path: string;
  signed_url: string | null;
  sort_order: number;
};

export type NewsletterTeacherUpdate = {
  id: string;
  section_id: string;
  teacher_id: string;
  body: string;
  updated_at: string;
};

export type NewsletterSection = {
  id: string;
  newsletter_id: string;
  label: string;
  body: string;
  visible: boolean;
  sort_order: number;
  is_class_updates: boolean;
  created_at: string;
  updated_at: string;
  teacher_updates: NewsletterTeacherUpdate[];
  images: NewsletterSectionImage[];
};

export type NewsletterChangeEntry = {
  id: string;
  newsletter_id: string;
  teacher_id: string;
  teacher_name: string | null;
  teacher_avatar: string | null;
  summary: string[];
  created_at: string;
};

export type Newsletter = {
  id: string;
  title: string;
  week_range: string;
  status: "draft" | "published";
  view_mode: "traditional" | "slideshow";
  created_by: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sections: NewsletterSection[];
  change_log: NewsletterChangeEntry[];
};

export type NewsletterListItem = {
  id: string;
  title: string;
  week_range: string;
  status: "draft" | "published";
  updated_at: string;
  created_at: string;
};

export type SaveDraftPayload = {
  title: string;
  week_range: string;
  view_mode: "traditional" | "slideshow";
  sections: Array<{
    id: string;
    label: string;
    body: string;
    visible: boolean;
  }>;
  classUpdatesSectionId: string | null;
  myTeacherUpdateBody: string;
  changeSummary: string[];
};

// ---------------------------------------------------------------------------
// Cross-screen pending edits (section editor → newsletter editor)
// ---------------------------------------------------------------------------

export const pendingSectionEdits = new Map<string, string>(); // sectionId → body
const _pendingTeacherUpdate = { body: null as string | null };

export function setPendingTeacherUpdateEdit(body: string) {
  _pendingTeacherUpdate.body = body;
}

export function getPendingTeacherUpdateEdit(): string | null {
  return _pendingTeacherUpdate.body;
}

export function clearPendingEdits() {
  pendingSectionEdits.clear();
  _pendingTeacherUpdate.body = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage
    .from("newsletter-images")
    .createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}

async function getTeacherProfileMap(
  ids: string[]
): Promise<Record<string, { full_name: string | null; profile_image_url: string | null }>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", ids);
  const map: Record<string, { full_name: string | null; profile_image_url: string | null }> = {};
  (data ?? []).forEach((p: any) => {
    map[p.id] = { full_name: p.full_name ?? null, profile_image_url: p.profile_image_url ?? null };
  });
  return map;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getNewsletters(): Promise<NewsletterListItem[]> {
  const { data, error } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .select("id, title, week_range, status, updated_at, created_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NewsletterListItem[];
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

const DEFAULT_SECTIONS = [
  { label: "Welcome Message", is_class_updates: false, sort_order: 0 },
  { label: "Class Updates",   is_class_updates: true,  sort_order: 1 },
  { label: "Upcoming Events", is_class_updates: false, sort_order: 2 },
  { label: "Parent Reminders",is_class_updates: false, sort_order: 3 },
  { label: "Photo Gallery",   is_class_updates: false, sort_order: 4 },
];

export async function createNewsletter(title: string, weekRange: string): Promise<Newsletter> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: nl, error: nlErr } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .insert({ title, week_range: weekRange, created_by: user.id })
    .select("id")
    .single();
  if (nlErr) throw nlErr;

  const { data: sections, error: secErr } = await supabase
    .schema("newsletters")
    .from("sections")
    .insert(
      DEFAULT_SECTIONS.map((s) => ({
        newsletter_id: nl.id,
        label: s.label,
        body: "",
        visible: true,
        sort_order: s.sort_order,
        is_class_updates: s.is_class_updates,
      }))
    )
    .select("id, is_class_updates");
  if (secErr) throw secErr;

  const classSection = (sections ?? []).find((s: any) => s.is_class_updates);
  if (classSection) {
    const { data: teachers } = await supabase
      .schema("admin")
      .from("users")
      .select("id")
      .in("role", ["teacher", "super_admin"])
      .eq("is_deleted", false);
    if (teachers && teachers.length > 0) {
      await supabase
        .schema("newsletters")
        .from("teacher_updates")
        .insert(
          teachers.map((t: any) => ({
            section_id: classSection.id,
            teacher_id: t.id,
            body: "",
          }))
        );
    }
  }

  return getNewsletter(nl.id);
}

// ---------------------------------------------------------------------------
// Get single (with all nested data + signed URLs)
// ---------------------------------------------------------------------------

export async function getNewsletter(id: string): Promise<Newsletter> {
  const { data, error } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .select(`
      id, title, week_range, status, view_mode, created_by, published_at, created_at, updated_at,
      sections (
        id, newsletter_id, label, body, visible, sort_order, is_class_updates, created_at, updated_at,
        teacher_updates (id, section_id, teacher_id, body, updated_at),
        section_images (id, storage_path, sort_order)
      ),
      change_log (id, newsletter_id, teacher_id, summary, created_at)
    `)
    .eq("id", id)
    .single();
  if (error) throw error;

  const allPaths: string[] = [];
  for (const sec of data.sections ?? []) {
    for (const img of (sec as any).section_images ?? []) {
      allPaths.push(img.storage_path);
    }
  }
  const urlMap = await getSignedUrls(allPaths);

  const clIds = [...new Set((data.change_log ?? []).map((cl: any) => cl.teacher_id as string))];
  const profileMap = await getTeacherProfileMap(clIds);

  return {
    id: data.id,
    title: data.title,
    week_range: data.week_range,
    status: data.status as "draft" | "published",
    view_mode: data.view_mode as "traditional" | "slideshow",
    created_by: data.created_by,
    published_at: (data as any).published_at ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    sections: ((data.sections ?? []) as any[])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((sec) => ({
        id: sec.id,
        newsletter_id: sec.newsletter_id,
        label: sec.label,
        body: sec.body,
        visible: sec.visible,
        sort_order: sec.sort_order,
        is_class_updates: sec.is_class_updates,
        created_at: sec.created_at,
        updated_at: sec.updated_at,
        teacher_updates: (sec.teacher_updates ?? []) as NewsletterTeacherUpdate[],
        images: ((sec.section_images ?? []) as any[])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            id: img.id,
            storage_path: img.storage_path,
            signed_url: urlMap[img.storage_path] ?? null,
            sort_order: img.sort_order,
          })),
      })),
    change_log: ((data.change_log ?? []) as any[])
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((cl) => ({
        id: cl.id,
        newsletter_id: cl.newsletter_id,
        teacher_id: cl.teacher_id,
        teacher_name: profileMap[cl.teacher_id]?.full_name ?? null,
        teacher_avatar: profileMap[cl.teacher_id]?.profile_image_url ?? null,
        summary: cl.summary ?? [],
        created_at: cl.created_at,
      })),
  };
}

// ---------------------------------------------------------------------------
// Save draft
// ---------------------------------------------------------------------------

export async function saveDraft(id: string, payload: SaveDraftPayload): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: nlErr } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .update({ title: payload.title, week_range: payload.week_range, view_mode: payload.view_mode })
    .eq("id", id);
  if (nlErr) throw nlErr;

  for (const sec of payload.sections) {
    const { error } = await supabase
      .schema("newsletters")
      .from("sections")
      .update({ label: sec.label, body: sec.body, visible: sec.visible })
      .eq("id", sec.id);
    if (error) throw error;
  }

  if (payload.classUpdatesSectionId) {
    const { error } = await supabase
      .schema("newsletters")
      .from("teacher_updates")
      .upsert(
        {
          section_id: payload.classUpdatesSectionId,
          teacher_id: user.id,
          body: payload.myTeacherUpdateBody,
        },
        { onConflict: "section_id,teacher_id" }
      );
    if (error) throw error;
  }

  if (payload.changeSummary.length > 0) {
    await supabase
      .schema("newsletters")
      .from("change_log")
      .insert({ newsletter_id: id, teacher_id: user.id, summary: payload.changeSummary });
  }

  clearPendingEdits();
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export async function publishNewsletter(id: string): Promise<void> {
  const { error } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export async function softDeleteNewsletter(id: string): Promise<void> {
  const { error } = await supabase
    .schema("newsletters")
    .from("newsletters")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Section images
// ---------------------------------------------------------------------------

export async function uploadSectionImage(
  sectionId: string,
  localUri: string
): Promise<NewsletterSectionImage> {
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const timestamp = Date.now();
  const storagePath = `${sectionId}/${timestamp}.jpg`;

  const fileRes = await fetch(compressed.uri);
  const blob = await fileRes.blob();
  const { data: { session } } = await supabase.auth.getSession();

  const uploadRes = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/newsletter-images/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: blob,
    }
  );
  if (!uploadRes.ok) {
    const msg = await uploadRes.text();
    throw new Error(`Image upload failed: ${msg}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: imgRow, error: insertErr } = await supabase
    .schema("newsletters")
    .from("section_images")
    .insert({ section_id: sectionId, storage_path: storagePath, uploaded_by: user!.id, sort_order: 0 })
    .select("id, storage_path, sort_order")
    .single();
  if (insertErr) throw insertErr;

  const { data: signedData } = await supabase.storage
    .from("newsletter-images")
    .createSignedUrl(storagePath, 3600);

  return {
    id: imgRow.id,
    storage_path: imgRow.storage_path,
    signed_url: signedData?.signedUrl ?? null,
    sort_order: imgRow.sort_order,
  };
}

export async function deleteSectionImage(imageId: string, storagePath: string): Promise<void> {
  await supabase
    .schema("newsletters")
    .from("section_images")
    .update({ is_deleted: true })
    .eq("id", imageId);
  await supabase.storage.from("newsletter-images").remove([storagePath]);
}

// ---------------------------------------------------------------------------
// Parent-facing: published newsletters list
// ---------------------------------------------------------------------------

export type ParentNewsletterListItem = {
  id: string;
  title: string;
  week_range: string;
  cover_image_path: string | null;
  cover_image_url: string | null;
  access_password: string | null;
  published_at: string | null;
};

export async function getPublishedNewsletters(limit?: number): Promise<ParentNewsletterListItem[]> {
  let query = supabase
    .schema("newsletters")
    .from("newsletters")
    .select("id, title, week_range, cover_image_path, access_password, published_at")
    .eq("is_deleted", false)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);
  const { data, error } = await query;

  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (n) => {
      let cover_image_url: string | null = null;
      if (n.cover_image_path) {
        const bucket = n.cover_image_path.startsWith("covers/")
          ? "newsletter-images"
          : "teacher-photos";
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(n.cover_image_path, 86400);
        cover_image_url = signed?.signedUrl ?? null;
      }
      return { ...n, cover_image_url };
    })
  );
}
