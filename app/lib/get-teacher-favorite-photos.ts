import { createAdminClient } from "@/app/lib/supabase-server";
import { TEACHER_FAVORITES } from "@/shared/parent/teacher-favorites";

/** Lower-cased full name → profile photo URL, for the Teacher Favorites cards. */
export type TeacherPhotoMap = Record<string, string | null>;

/** Same lookup as mobile's useTeacherPhotos. Photos are decorative, so errors return {}. */
export async function getTeacherFavoritePhotos(): Promise<TeacherPhotoMap> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .in(
      "full_name",
      TEACHER_FAVORITES.map((t) => t.fullName),
    );
  if (error || !data) return {};
  const map: TeacherPhotoMap = {};
  for (const row of data as { full_name: string | null; profile_image_url: string | null }[]) {
    if (row.full_name) map[row.full_name.toLowerCase()] = row.profile_image_url;
  }
  return map;
}
