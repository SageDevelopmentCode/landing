import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { ParticipationLevel } from "@/lib/activity-preferences";
export { childHasVisibleUpcomingActivity } from "@/lib/activity-preferences";

export type StudentDefaultPreference = {
  student_id: string;
  participation_level: ParticipationLevel;
};

export async function persistStudentDefaultPreference(opts: {
  parentId: string;
  studentId: string;
  level: ParticipationLevel | null;
  notify?: {
    parentName: string;
    parentEmail: string;
    childName: string;
  };
}): Promise<{ error?: string }> {
  try {
    if (opts.level !== null) {
      const { error } = await supabase
        .schema("parent_app")
        .from("student_default_preferences")
        .upsert(
          {
            parent_id: opts.parentId,
            student_id: opts.studentId,
            participation_level: opts.level,
          },
          { onConflict: "parent_id,student_id" },
        );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .schema("parent_app")
        .from("student_default_preferences")
        .delete()
        .eq("parent_id", opts.parentId)
        .eq("student_id", opts.studentId);
      if (error) throw error;
    }

    if (opts.notify) {
      notifyDiscord({
        type: "default_preference_set",
        data: {
          parentName: opts.notify.parentName,
          parentEmail: opts.notify.parentEmail,
          childName: opts.notify.childName,
          level: opts.level,
        },
      });
    }

    return {};
  } catch (err) {
    notifyError("default-preference-save", err);
    return {
      error: err instanceof Error ? err.message : "Failed to save default",
    };
  }
}

