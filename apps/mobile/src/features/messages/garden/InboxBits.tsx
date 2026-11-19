// Inbox rows shared by the parent and staff inboxes.
import {
  CountBadge,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  PressableScale,
  gardenCard,
} from "@/components/garden";
import type { ChannelWithMeta } from "@/lib/channel-actions";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ATTACHMENT_PREVIEW, shortTimeAgo, type ConversationRow } from "../messagingApi";

export const INBOX_GUTTER = 18;
const GUTTER = INBOX_GUTTER;

export function ConversationCard({
  item,
  index,
  onOpen,
}: {
  item: ConversationRow;
  index: number;
  onOpen: (item: ConversationRow) => void;
}) {
  const unread = item.unreadCount > 0;
  const preview = item.lastMessagePreview === "" ? ATTACHMENT_PREVIEW : (item.lastMessagePreview ?? "No messages yet");
  return (
    <Animated.View entering={index < 8 ? FadeInDown.delay(index * 35).springify().damping(18) : undefined}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => onOpen(item)}
        accessibilityLabel={`${item.otherUserName}${unread ? `, ${item.unreadCount} unread` : ""}. ${preview}`}
        accessibilityHint="Opens the conversation"
        style={[bs.row, unread && bs.rowUnread]}
      >
        <GardenAvatar
          name={item.otherUserName}
          uri={item.isGroup ? null : item.otherUserProfileImageUrl}
          seed={item.otherUserId || item.id}
          icon={item.isGroup ? "people" : undefined}
          size={50}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={bs.rowTop}>
            <Text style={[bs.name, unread && { fontFamily: GardenFonts.bodyHeavy }]} numberOfLines={1}>
              {item.otherUserName}
            </Text>
            <Text style={[bs.time, unread && { color: Garden.coralDeep, fontFamily: GardenFonts.bodyHeavy }]}>
              {shortTimeAgo(item.updatedAt)}
            </Text>
          </View>
          {item.isGroup && item.participantCount > 0 ? (
            <Text style={bs.sub}>{item.participantCount} members</Text>
          ) : null}
          <View style={bs.rowTop}>
            <Text style={[bs.preview, unread && { color: Garden.ink, fontFamily: GardenFonts.bodyBold }]} numberOfLines={1}>
              {preview}
            </Text>
            <CountBadge count={item.unreadCount} />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function ChannelCard({
  c,
  index,
  onOpen,
}: {
  c: ChannelWithMeta;
  index: number;
  onOpen: (c: ChannelWithMeta) => void;
}) {
  const unread = c.isMember && c.unreadCount > 0;
  const preview = c.lastMessage
    ? c.lastMessage.body || ATTACHMENT_PREVIEW
    : c.description
      ? c.description
      : `${c.memberCount} ${c.memberCount === 1 ? "member" : "members"}`;
  return (
    <Animated.View entering={index < 8 ? FadeInDown.delay(index * 35).springify().damping(18) : undefined}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => onOpen(c)}
        accessibilityLabel={`#${c.name}${unread ? `, ${c.unreadCount} unread` : ""}${!c.isMember ? ", not joined" : ""}. ${preview}`}
        accessibilityHint="Opens the channel"
        style={[bs.row, unread && bs.rowUnread]}
      >
        <View style={[bs.hash, c.is_default && { backgroundColor: Garden.butter }]}>
          <Text style={[bs.hashText, c.is_default && { color: "#7a5a00" }]}>#</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={bs.rowTop}>
            <Text style={[bs.name, unread && { fontFamily: GardenFonts.bodyHeavy }]} numberOfLines={1}>
              {c.name}
            </Text>
            {c.lastMessage ? <Text style={bs.time}>{shortTimeAgo(c.lastMessage.created_at)}</Text> : null}
          </View>
          <View style={bs.rowTop}>
            <Text style={[bs.preview, unread && { color: Garden.ink, fontFamily: GardenFonts.bodyBold }]} numberOfLines={1}>
              {preview}
            </Text>
            {!c.isMember ? (
              <View style={bs.joinPill}>
                <Text style={bs.joinText}>Join</Text>
              </View>
            ) : (
              <CountBadge count={c.unreadCount} />
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function RowSkeletons() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 8 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[bs.row, { backgroundColor: Garden.white }]}>
          <GardenSkeleton width={50} height={50} radius={25} />
          <View style={{ flex: 1, gap: 7 }}>
            <GardenSkeleton width="55%" height={14} radius={6} />
            <GardenSkeleton width="80%" height={12} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const bs = StyleSheet.create({
  row: {
    ...gardenCard,
    borderRadius: 22,
    marginHorizontal: GUTTER,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 74,
  },
  rowUnread: { borderColor: "#f3c9c2", backgroundColor: "#fffaf6" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 16, color: Garden.ink },
  time: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  preview: { flex: 1, fontFamily: GardenFonts.body, fontSize: 14, color: Garden.soft },
  hash: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  hashText: { fontFamily: GardenFonts.display, fontSize: 24, color: "#2f6b44" },
  joinPill: { backgroundColor: Garden.coralDeep, borderRadius: GardenRadii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  joinText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
});
