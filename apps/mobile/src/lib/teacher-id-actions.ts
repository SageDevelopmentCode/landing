import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

export type TeacherIdCard = {
  id: string;
  user_id: string | null;
  full_name: string;
  title: string;
  grade_classroom: string | null;
  issue_year: number;
  photo_url: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type TeacherIdCardInput = {
  user_id?: string | null;
  full_name: string;
  title: string;
  grade_classroom?: string | null;
  issue_year: number;
  sort_order?: number;
};

const TABLE = "teacher_id_cards";
const BUCKET = "teacher-id-photos";

export async function fetchTeacherIdCards(): Promise<TeacherIdCard[]> {
  const { data, error } = await supabase
    .schema("teachers")
    .from(TABLE)
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TeacherIdCard[];
}

export async function createTeacherIdCard(
  input: TeacherIdCardInput,
): Promise<TeacherIdCard> {
  const { data, error } = await supabase
    .schema("teachers")
    .from(TABLE)
    .insert({
      user_id: input.user_id ?? null,
      full_name: input.full_name.trim(),
      title: input.title.trim(),
      grade_classroom: input.grade_classroom?.trim() || null,
      issue_year: input.issue_year,
      sort_order: input.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Failed to create teacher ID card");
  return data as TeacherIdCard;
}

export async function updateTeacherIdCard(
  id: string,
  input: Partial<TeacherIdCardInput> & { photo_url?: string | null },
): Promise<TeacherIdCard> {
  const payload: Record<string, unknown> = {};
  if (input.full_name !== undefined) payload.full_name = input.full_name.trim();
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.grade_classroom !== undefined) {
    payload.grade_classroom = input.grade_classroom?.trim() || null;
  }
  if (input.issue_year !== undefined) payload.issue_year = input.issue_year;
  if (input.user_id !== undefined) payload.user_id = input.user_id;
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
  if (input.photo_url !== undefined) payload.photo_url = input.photo_url;

  const { data, error } = await supabase
    .schema("teachers")
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Failed to update teacher ID card");
  return data as TeacherIdCard;
}

export async function softDeleteTeacherIdCard(id: string): Promise<void> {
  const { error } = await supabase
    .schema("teachers")
    .from(TABLE)
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) throw error;
}

export function getTeacherIdPhotoPublicUrl(cardId: string): string {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${cardId}/photo.jpg`;
}

export async function uploadTeacherIdPhoto(
  cardId: string,
  localUri: string,
  accessToken: string,
): Promise<string> {
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const fileRes = await fetch(compressed.uri);
  const blob = await fileRes.blob();
  const storagePath = `${cardId}/photo.jpg`;

  const uploadRes = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: blob,
    },
  );

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Photo upload failed: ${body}`);
  }

  const publicUrl = getTeacherIdPhotoPublicUrl(cardId);
  await updateTeacherIdCard(cardId, { photo_url: publicUrl });
  return publicUrl;
}
