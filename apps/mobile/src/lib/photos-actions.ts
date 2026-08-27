import { supabase } from "@/lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentLevel = "FULL" | "LIMITED" | "NO";
export type PublicationLabel = "newsletter" | "social_media" | "website";

export type PhotoStudentTag = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
  consent_level: ConsentLevel | null;
};

export type TeacherPhoto = {
  id: string;
  teacher_id: string;
  storage_path: string;
  signed_url: string | null;
  caption: string | null;
  taken_on: string | null;
  created_at: string;
  tags: PhotoStudentTag[];
  publication_labels: PublicationLabel[];
};

export type StudentWithConsent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
  consent_level: ConsentLevel | null;
};

export type UploadPhotoPayload = {
  localUri: string;
  caption: string | null;
  taken_on: string | null;
  taggedStudentIds: string[];
  publication_labels: PublicationLabel[];
};

export type EditPhotoPayload = {
  caption: string | null;
  taken_on: string | null;
  taggedStudentIds: string[];
  publication_labels: PublicationLabel[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function fetchSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage
    .from("teacher-photos")
    .createSignedUrls(paths, 86400);
  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  });
  return map;
}

async function uploadImageToStorage(
  localUri: string,
  storagePath: string,
  accessToken: string
): Promise<void> {
  console.log("[uploadImageToStorage] compressing", storagePath);
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  try {
    console.log("[uploadImageToStorage] fetching blob from", compressed.uri);
    const fileRes = await fetch(compressed.uri);
    const blob = await fileRes.blob();
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/teacher-photos/${storagePath}`;
    console.log("[uploadImageToStorage] POSTing to", url, "blob size:", blob.size);
    const uploadRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: blob,
    });
    console.log("[uploadImageToStorage] response status:", uploadRes.status);
    if (!uploadRes.ok) {
      const msg = await uploadRes.text();
      console.error("[uploadImageToStorage] FAILED — status:", uploadRes.status, "body:", msg);
      throw new Error(`Photo upload failed: ${msg}`);
    }
    console.log("[uploadImageToStorage] storage upload OK");
  } finally {
    await FileSystem.deleteAsync(compressed.uri, { idempotent: true });
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getTeacherPhotos(userId: string): Promise<TeacherPhoto[]> {
  const { data, error } = await supabase.rpc("get_teacher_photos", {
    p_teacher_id: userId,
  });
  if (error) throw new Error(error.message);

  const rows: any[] = data ?? [];

  return rows.map((r: any) => ({
    id: r.id,
    teacher_id: r.teacher_id,
    storage_path: r.storage_path,
    signed_url: null,
    caption: r.caption ?? null,
    taken_on: r.taken_on ?? null,
    created_at: r.created_at,
    tags: (r.tags ?? []).map((t: any) => ({
      student_id: t.student_id,
      name: t.name ?? null,
      profile_image_url: t.profile_image_url ?? null,
      consent_level: (t.consent_level as ConsentLevel) ?? null,
    })),
    publication_labels: (r.publication_labels ?? []) as PublicationLabel[],
  }));
}

export async function getAllSchoolPhotos(): Promise<TeacherPhoto[]> {
  console.log("[getAllSchoolPhotos] calling RPC");
  const { data, error } = await supabase.rpc("get_all_school_photos");
  console.log("[getAllSchoolPhotos] data:", JSON.stringify(data)?.slice(0, 300), "error:", error);
  if (error) throw new Error(error.message);

  const rows: any[] = data ?? [];
  console.log("[getAllSchoolPhotos] rows count:", rows.length);

  return rows.map((r: any) => ({
    id: r.id,
    teacher_id: r.teacher_id,
    storage_path: r.storage_path,
    signed_url: null,
    caption: r.caption ?? null,
    taken_on: r.taken_on ?? null,
    created_at: r.created_at,
    tags: (r.tags ?? []).map((t: any) => ({
      student_id: t.student_id,
      name: t.name ?? null,
      profile_image_url: t.profile_image_url ?? null,
      consent_level: (t.consent_level as ConsentLevel) ?? null,
    })),
    publication_labels: (r.publication_labels ?? []) as PublicationLabel[],
  }));
}

export async function getEnrolledStudentsWithConsent(): Promise<StudentWithConsent[]> {
  const { data: appsData } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("student_id")
    .eq("status", "enrolled");

  const studentIds = (appsData ?? []).map((a: any) => a.student_id as string);
  if (studentIds.length === 0) return [];

  const [studentsRes, consentRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("is_deleted", false)
      .in("id", studentIds)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("student_photo_release_consent")
      .select("student_id, consent_level")
      .in("student_id", studentIds),
  ]);

  const consentMap = new Map<string, ConsentLevel>();
  (consentRes.data ?? []).forEach((c: any) => {
    consentMap.set(c.student_id, c.consent_level as ConsentLevel);
  });

  return (studentsRes.data ?? []).map((s: any) => ({
    student_id: s.id,
    name: s.child_legal_name ?? null,
    profile_image_url: s.profile_image_url ?? null,
    consent_level: consentMap.get(s.id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function uploadPhoto(
  payload: UploadPhotoPayload,
  userId: string
): Promise<TeacherPhoto> {
  console.log("[uploadPhoto] getting session for user", userId);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("[uploadPhoto] no session — user is not authenticated");
    throw new Error("Not authenticated");
  }
  console.log("[uploadPhoto] session OK, token prefix:", session.access_token.slice(0, 20));

  const photoId = generateId();
  const storagePath = `${userId}/${photoId}/${Date.now()}.jpeg`;

  await uploadImageToStorage(payload.localUri, storagePath, session.access_token);
  console.log("[uploadPhoto] storage upload done, inserting photo row id:", photoId);

  const { error: insertError } = await supabase
    .schema("teachers")
    .from("photos")
    .insert({
      id: photoId,
      teacher_id: userId,
      storage_path: storagePath,
      caption: payload.caption,
      taken_on: payload.taken_on,
      publication_labels: payload.publication_labels,
      is_deleted: false,
    });
  if (insertError) {
    console.error("[uploadPhoto] photo insert error:", insertError.code, insertError.message, insertError.details);
    throw new Error(insertError.message);
  }
  console.log("[uploadPhoto] photo row inserted OK");

  if (payload.taggedStudentIds.length > 0) {
    console.log("[uploadPhoto] inserting", payload.taggedStudentIds.length, "student tags");
    const { error: tagError } = await supabase
      .schema("teachers")
      .from("photo_student_tags")
      .insert(
        payload.taggedStudentIds.map((sid) => ({
          photo_id: photoId,
          student_id: sid,
        }))
      );
    if (tagError) {
      console.error("[uploadPhoto] tag insert error:", tagError.code, tagError.message, tagError.details);
      throw new Error(tagError.message);
    }
    console.log("[uploadPhoto] tags inserted OK");
  }

  const { data: signedData } = await supabase.storage
    .from("teacher-photos")
    .createSignedUrl(storagePath, 3600);

  return {
    id: photoId,
    teacher_id: userId,
    storage_path: storagePath,
    signed_url: signedData?.signedUrl ?? null,
    caption: payload.caption,
    taken_on: payload.taken_on,
    created_at: new Date().toISOString(),
    tags: [],
    publication_labels: payload.publication_labels,
  };
}

export async function editPhoto(
  photoId: string,
  payload: EditPhotoPayload
): Promise<void> {
  const { error: updateError } = await supabase
    .schema("teachers")
    .from("photos")
    .update({
      caption: payload.caption,
      taken_on: payload.taken_on,
      publication_labels: payload.publication_labels,
      updated_at: new Date().toISOString(),
    })
    .eq("id", photoId);
  if (updateError) throw new Error(updateError.message);

  await supabase
    .schema("teachers")
    .from("photo_student_tags")
    .delete()
    .eq("photo_id", photoId);

  if (payload.taggedStudentIds.length > 0) {
    const { error: tagError } = await supabase
      .schema("teachers")
      .from("photo_student_tags")
      .insert(
        payload.taggedStudentIds.map((sid) => ({
          photo_id: photoId,
          student_id: sid,
        }))
      );
    if (tagError) throw new Error(tagError.message);
  }
}

export async function deletePhoto(
  photoId: string,
  storagePath: string
): Promise<void> {
  console.log("[deletePhoto] deleting photoId:", photoId);
  const { error } = await supabase
    .schema("teachers")
    .from("photos")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", photoId);
  if (error) {
    console.error("[deletePhoto] delete error:", error.code, error.message, error.details, error.hint);
    throw new Error(error.message);
  }
  console.log("[deletePhoto] soft-delete OK, removing storage:", storagePath);
  supabase.storage.from("teacher-photos").remove([storagePath]);
}
