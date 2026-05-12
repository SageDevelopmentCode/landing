import { getConversations } from "@/app/parent/messages/actions";
import { getChannels } from "@/app/messages/channel-actions";
import NotificationBell, { type NotificationItem } from "@/app/parent/components/NotificationBell";

export default async function TeacherNotificationBell({ userId }: { userId: string }) {
  const [conversations, channels] = await Promise.all([
    getConversations(userId),
    getChannels(userId),
  ]);

  const notificationItems: NotificationItem[] = [
    ...conversations
      .filter((c) => c.unreadCount > 0 && c.lastMessage)
      .map((c) => ({
        id: c.id,
        kind: "direct" as const,
        name: c.otherUser.full_name,
        preview: c.lastMessage!.body.slice(0, 40),
        timestamp: c.lastMessage!.created_at,
        unreadCount: c.unreadCount,
        otherUserId: c.otherUser.id,
      })),
    ...channels
      .filter((ch) => ch.isMember && ch.unreadCount > 0 && ch.lastMessage)
      .map((ch) => ({
        id: ch.id,
        kind: "channel" as const,
        name: `#${ch.name}`,
        preview: ch.lastMessage!.body.slice(0, 40),
        timestamp: ch.lastMessage!.created_at,
        unreadCount: ch.unreadCount,
      })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const totalUnread = notificationItems.reduce((sum, i) => sum + i.unreadCount, 0);

  return (
    <NotificationBell
      items={notificationItems}
      totalUnread={totalUnread}
      baseMessagesPath="/teacher/messages"
    />
  );
}
