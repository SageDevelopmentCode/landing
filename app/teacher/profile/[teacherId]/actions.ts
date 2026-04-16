"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export async function updateTeacherProfile(
  teacherId: string,
  fields: {
    bio: string | null;
    quote: string | null;
    years_experience: string | null;
    grade_range: string | null;
  }
) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("teachers")
    .from("teacher_profiles")
    .upsert(
      {
        user_id: teacherId,
        bio: fields.bio || null,
        quote: fields.quote || null,
        years_experience: fields.years_experience || null,
        grade_range: fields.grade_range || null,
      },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(error.message);
}
