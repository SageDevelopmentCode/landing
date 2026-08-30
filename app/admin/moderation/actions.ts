"use server";

import { createAdminClient } from "@/app/lib/supabase-server";
import { getStudentDisplayName } from "@/app/lib/student-display-name";

export type ModerationParticipant = {
  id: string;
  full_name: string;
  role: string | null;
  profile_image_url: string | null;
};

export type ModerationConversation = {
  id: string;
  updated_at: string;
  kind: "direct" | "household_teacher";
  isGroup: boolean;
  displayName: string;
  participants: ModerationParticipant[];
  lastMessage: { body: string; created_at: string; sender_id: string } | null;
  messageCount: number;
  studentId?: string | null;
  teacherId?: string | null;
};

export type ModerationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_image_url: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
};

export async function getAllConversations(): Promise<ModerationConversation[]> {
  const adminClient = createAdminClient();

  const { data: convos } = await adminClient
    .schema("messaging")
    .from("conversations")
    .select("id, updated_at, kind, student_id, teacher_id")
    .order("updated_at", { ascending: false });

  if (!convos?.length) return [];

  const convoIds = convos.map((c) => c.id);
  const householdStudentIds = [
    ...new Set(
      convos
        .filter((c) => c.kind === "household_teacher" && c.student_id)
        .map((c) => c.student_id as string),
    ),
  ];
  const householdTeacherIds = [
    ...new Set(
      convos
        .filter((c) => c.kind === "household_teacher" && c.teacher_id)
        .map((c) => c.teacher_id as string),
    ),
  ];

  const [
    { data: participants },
    { data: allMsgs },
    { data: students },
    { data: apps },
    { data: teachers },
  ] = await Promise.all([
    adminClient
      .schema("messaging")
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convoIds),
    adminClient
      .schema("messaging")
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false }),
    householdStudentIds.length > 0
      ? adminClient
          .schema("admin")
          .from("students")
          .select("id, child_legal_name")
          .in("id", householdStudentIds)
      : Promise.resolve({ data: [] as { id: string; child_legal_name: string | null }[] }),
    householdStudentIds.length > 0
      ? adminClient
          .schema("parent_app")
          .from("applications")
          .select("student_id, preferred_name, child_legal_name")
          .in("student_id", householdStudentIds)
          .eq("status", "enrolled")
      : Promise.resolve({
          data: [] as {
            student_id: string;
            preferred_name: string | null;
            child_legal_name: string | null;
          }[],
        }),
    householdTeacherIds.length > 0
      ? adminClient
          .schema("admin")
          .from("users")
          .select("id, full_name")
          .in("id", householdTeacherIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const allUserIds = [...new Set((participants ?? []).map((p) => p.user_id))];
  const { data: users } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, role, profile_image_url")
    .in("id", allUserIds);

  const userMap = Object.fromEntries(
    (users ?? []).map((u) => [u.id, u as ModerationParticipant]),
  );

  const studentNameById = new Map<string, string>();
  for (const app of apps ?? []) {
    studentNameById.set(
      app.student_id,
      getStudentDisplayName(app.preferred_name, app.child_legal_name),
    );
  }
  for (const student of students ?? []) {
    if (!studentNameById.has(student.id)) {
      studentNameById.set(
        student.id,
        getStudentDisplayName(null, student.child_legal_name),
      );
    }
  }

  const teacherNameById = new Map(
    (teachers ?? []).map((t) => [t.id, t.full_name ?? "Teacher"]),
  );

  const participantsByConvo = (participants ?? []).reduce<Record<string, string[]>>(
    (acc, p) => {
      (acc[p.conversation_id] ??= []).push(p.user_id);
      return acc;
    },
    {},
  );

  type MsgMeta = {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  };
  const msgsByConvo = (allMsgs ?? []).reduce<Record<string, MsgMeta[]>>(
    (acc, m) => {
      (acc[m.conversation_id] ??= []).push(m);
      return acc;
    },
    {},
  );

  return convos
    .map((c): ModerationConversation | null => {
      const participantIds = participantsByConvo[c.id] ?? [];
      const resolvedParticipants = participantIds
        .map((uid) => userMap[uid])
        .filter(Boolean) as ModerationParticipant[];

      if (resolvedParticipants.length < 2) return null;

      const kind: ModerationConversation["kind"] =
        c.kind === "household_teacher" ? "household_teacher" : "direct";
      const isGroup = kind === "household_teacher";

      let displayName: string;
      if (isGroup && c.student_id) {
        const studentName =
          studentNameById.get(c.student_id) ?? "Student";
        const teacherName = c.teacher_id
          ? (teacherNameById.get(c.teacher_id) ?? "Teacher")
          : "Teacher";
        displayName = `${studentName} · ${teacherName}`;
      } else {
        const [p0, p1] = resolvedParticipants;
        displayName = `${p0.full_name} · ${p1.full_name}`;
      }

      const msgs = msgsByConvo[c.id] ?? [];
      const lastMsg = msgs[0] ?? null;

      return {
        id: c.id,
        updated_at: c.updated_at,
        kind,
        isGroup,
        displayName,
        participants: resolvedParticipants,
        lastMessage: lastMsg
          ? {
              body: lastMsg.body,
              created_at: lastMsg.created_at,
              sender_id: lastMsg.sender_id,
            }
          : null,
        messageCount: msgs.length,
        studentId: c.student_id ?? null,
        teacherId: c.teacher_id ?? null,
      };
    })
    .filter((c): c is ModerationConversation => c !== null)
    .sort((a, b) => {
      const aTime = new Date(a.lastMessage?.created_at ?? a.updated_at).getTime();
      const bTime = new Date(b.lastMessage?.created_at ?? b.updated_at).getTime();
      return bTime - aTime;
    });
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ModerationMessage[]> {
  const adminClient = createAdminClient();

  const { data: messages } = await adminClient
    .schema("messaging")
    .from("messages")
    .select(
      "id, conversation_id, sender_id, body, created_at, read_at, image_url, file_url, file_name",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages?.length) return [];

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: senders } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", senderIds);

  const senderMap = Object.fromEntries(
    (senders ?? []).map((u) => [u.id, u]),
  );

  return messages.map((m) => ({
    ...m,
    sender_name: senderMap[m.sender_id]?.full_name ?? "Unknown",
    sender_image_url: senderMap[m.sender_id]?.profile_image_url ?? null,
  }));
}
