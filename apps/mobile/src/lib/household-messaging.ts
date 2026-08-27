import { supabase } from "@/lib/supabase";
import type { ParentsForTeacher } from "@/lib/teacher-messaging";

export async function resolveHouseholdConversation(
  parentId: string,
  teacherId: string,
  parentDirectory: ParentsForTeacher | null,
): Promise<string | null> {
  const fromMine = parentDirectory?.myStudentsParents.find(
    (p) => p.id === parentId,
  );
  const studentId = fromMine?.children[0]?.id;

  if (studentId) {
    const { data, error } = await supabase.rpc(
      "find_or_create_household_teacher_conversation",
      {
        p_student_id: studentId,
        p_teacher_id: teacherId,
        p_caller_id: teacherId,
      },
    );
    if (error) return null;
    return data as string | null;
  }

  const { data, error } = await supabase.rpc("find_or_create_conversation", {
    other_user_id: parentId,
  });
  if (error) return null;
  return data as string | null;
}

export type ConversationListRow = {
  id: string;
  other_user_id: string | null;
  other_user_name: string | null;
  other_user_profile_image: string | null;
  is_group: boolean;
  display_name: string | null;
};

export async function getConversationListMeta(
  userId: string,
  conversationId: string,
): Promise<ConversationListRow | null> {
  const { data } = await supabase.rpc("get_conversation_list", {
    p_user_id: userId,
  });
  const match = (data as ConversationListRow[] | null)?.find(
    (c) => c.id === conversationId,
  );
  return match ?? null;
}
