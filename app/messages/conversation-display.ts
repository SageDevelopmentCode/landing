import type { ConversationWithMeta } from "@/app/parent/messages/actions";

function roleLabel(role: string | null | undefined): string {
  if (role === "teacher" || role === "super_admin") return "Teacher";
  if (role === "parent") return "Parent";
  return "";
}

export function isGroupConversation(convo: ConversationWithMeta): boolean {
  return convo.isGroup || !convo.otherUser;
}

export function conversationTitle(convo: ConversationWithMeta): string {
  if (convo.displayName) return convo.displayName;
  if (isGroupConversation(convo)) return "Group";
  return convo.otherUser?.full_name ?? "Unknown";
}

export function conversationSubtitle(convo: ConversationWithMeta): string | null {
  if (isGroupConversation(convo)) {
    const count = convo.participantCount;
    return count > 0 ? `${count} members` : "Group";
  }
  return roleLabel(convo.otherUser?.role) || null;
}
